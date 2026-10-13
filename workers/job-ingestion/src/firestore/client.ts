import { UsageMeter } from '../budget/usage-meter';

type FsValue =
	| { stringValue: string }
	| { integerValue: string }
	| { doubleValue: number }
	| { booleanValue: boolean }
	| { nullValue: null }
	| { timestampValue: string }
	| { arrayValue: { values?: FsValue[] } }
	| { mapValue: { fields?: Record<string, FsValue> } };

export type FsRecord = Record<string, unknown>;

function encode(value: unknown): FsValue {
	if (value === null || value === undefined) return { nullValue: null };
	if (typeof value === 'string') return { stringValue: value };
	if (typeof value === 'boolean') return { booleanValue: value };
	if (typeof value === 'number') {
		return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
	}
	if (value instanceof Date) return { timestampValue: value.toISOString() };
	if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
	return { mapValue: { fields: encodeFields(value as FsRecord) } };
}

function encodeFields(record: FsRecord): Record<string, FsValue> {
	return Object.fromEntries(
		Object.entries(record)
			.filter(([, v]) => v !== undefined)
			.map(([k, v]) => [k, encode(v)]),
	);
}

function decode(value: FsValue): unknown {
	if ('stringValue' in value) return value.stringValue;
	if ('integerValue' in value) return Number(value.integerValue);
	if ('doubleValue' in value) return value.doubleValue;
	if ('booleanValue' in value) return value.booleanValue;
	if ('timestampValue' in value) return new Date(value.timestampValue);
	if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decode);
	if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {});
	return null;
}

function decodeFields(fields: Record<string, FsValue>): FsRecord {
	return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));
}

export class FirestoreError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

export class FirestoreClient {
	private readonly base: string;
	private readonly docRoot: string;

	constructor(
		projectId: string,
		databaseId: string,
		private readonly getToken: () => Promise<string>,
		private readonly meter?: UsageMeter,
	) {
		this.docRoot = `projects/${projectId}/databases/${databaseId}/documents`;
		this.base = `https://firestore.googleapis.com/v1/${this.docRoot}`;
	}

	private async request(path: string, init: RequestInit = {}, allowNotFound = false): Promise<Response> {
		this.meter?.reserve('requests', 1);
		const res = await fetch(path.startsWith(':') ? `${this.base}${path}` : `${this.base}/${path}`, {
			...init,
			headers: {
				authorization: `Bearer ${await this.getToken()}`,
				'content-type': 'application/json',
			},
		});
		if (res.ok || (allowNotFound && res.status === 404)) return res;
		const body = (await res.json().catch(() => ({}))) as {
			error?: { status?: string; message?: string };
		};
		throw new FirestoreError(res.status, `Firestore ${res.status} ${body.error?.status ?? ''} ${body.error?.message ?? ''}`.trim());
	}

	async create(collection: string, id: string, data: FsRecord): Promise<void> {
		await this.request(`${collection}?documentId=${encodeURIComponent(id)}`, {
			method: 'POST',
			body: JSON.stringify({ fields: encodeFields(data) }),
		});
	}

	async get(collection: string, id: string): Promise<FsRecord | null> {
		const res = await this.request(`${collection}/${encodeURIComponent(id)}`, {}, true);
		if (res.status === 404) return null;
		this.meter?.charge('reads');
		const doc = (await res.json()) as { fields?: Record<string, FsValue> };
		return decodeFields(doc.fields ?? {});
	}

	async delete(collection: string, id: string): Promise<void> {
		await this.request(`${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
	}

	async commit(writes: Array<{ collection: string; id: string; data: FsRecord; fieldPaths?: string[] }>): Promise<void> {
		if (!writes.length) return;
		if (writes.length > 500) throw new Error('Firestore commit limited to 500 writes');
		this.meter?.reserve('writes', writes.length);
		await this.request(':commit', {
			method: 'POST',
			body: JSON.stringify({
				writes: writes.map((w) => ({
					update: { name: `${this.docRoot}/${w.collection}/${w.id}`, fields: encodeFields(w.data) },
					...(w.fieldPaths ? { updateMask: { fieldPaths: w.fieldPaths } } : {}),
				})),
			}),
		});
	}

	async collectionGroup(
		collectionId: string,
		field: string,
		op: 'LESS_THAN' | 'GREATER_THAN_OR_EQUAL',
		value: Date,
		limit: number,
		direction: 'ASCENDING' | 'DESCENDING' = 'ASCENDING',
	): Promise<Array<{ path: string; data: FsRecord }>> {
		const res = await this.request(':runQuery', {
			method: 'POST',
			body: JSON.stringify({
				structuredQuery: {
					from: [{ collectionId, allDescendants: true }],
					where: { fieldFilter: { field: { fieldPath: field }, op, value: { timestampValue: value.toISOString() } } },
					orderBy: [{ field: { fieldPath: field }, direction }],
					limit,
				},
			}),
		});
		const rows = (await res.json()) as Array<{ document?: { name: string; fields?: Record<string, FsValue> } }>;
		this.meter?.charge('reads', rows.filter((r) => r.document).length || 1);
		return rows.flatMap((r) =>
			r.document ? [{ path: r.document.name.slice(this.docRoot.length + 1), data: decodeFields(r.document.fields ?? {}) }] : [],
		);
	}

	async getMany(paths: string[]): Promise<Map<string, FsRecord>> {
		if (!paths.length) return new Map();
		const res = await this.request(':batchGet', {
			method: 'POST',
			body: JSON.stringify({ documents: paths.map((p) => `${this.docRoot}/${p}`) }),
		});
		const rows = (await res.json()) as Array<{ found?: { name: string; fields?: Record<string, FsValue> } }>;
		this.meter?.charge('reads', paths.length);
		return new Map(
			rows.flatMap((r) => (r.found ? [[r.found.name.slice(this.docRoot.length + 1), decodeFields(r.found.fields ?? {})] as const] : [])),
		);
	}

	async list(collection: string, fieldPaths: string[], pageSize: number): Promise<Array<{ path: string; data: FsRecord }>> {
		const mask = fieldPaths.map((f) => `mask.fieldPaths=${encodeURIComponent(f)}`).join('&');
		const res = await this.request(`${collection}?pageSize=${pageSize}&${mask}`, {}, true);
		if (res.status === 404) return [];
		const body = (await res.json()) as { documents?: Array<{ name: string; fields?: Record<string, FsValue> }> };
		const docs = body.documents ?? [];
		this.meter?.charge('reads', docs.length || 1);
		return docs.map((d) => ({ path: d.name.slice(this.docRoot.length + 1), data: decodeFields(d.fields ?? {}) }));
	}

	async deleteDocs(paths: string[]): Promise<void> {
		if (paths.length) this.meter?.reserve('deletes', paths.length);
		for (let i = 0; i < paths.length; i += 500) {
			await this.request(':commit', {
				method: 'POST',
				body: JSON.stringify({ writes: paths.slice(i, i + 500).map((p) => ({ delete: `${this.docRoot}/${p}` })) }),
			});
		}
	}
}
