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

	constructor(
		projectId: string,
		databaseId: string,
		private readonly getToken: () => Promise<string>,
	) {
		this.base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
	}

	private async request(path: string, init: RequestInit = {}, allowNotFound = false): Promise<Response> {
		const res = await fetch(`${this.base}/${path}`, {
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
		const doc = (await res.json()) as { fields?: Record<string, FsValue> };
		return decodeFields(doc.fields ?? {});
	}

	async delete(collection: string, id: string): Promise<void> {
		await this.request(`${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
	}
}
