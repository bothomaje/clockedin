import { FirestoreClient } from './client';

interface Step {
	step: string;
	ok: boolean;
	ms: number;
	error?: string;
}

export async function runConnectivityCheck(db: FirestoreClient, getToken: () => Promise<string>): Promise<{ ok: boolean; steps: Step[] }> {
	const collection = '_healthcheck';
	const id = crypto.randomUUID();
	const steps: Step[] = [];

	const run = async <T>(step: string, fn: () => Promise<T>): Promise<T> => {
		const start = Date.now();
		try {
			const result = await fn();
			steps.push({ step, ok: true, ms: Date.now() - start });
			return result;
		} catch (e) {
			steps.push({ step, ok: false, ms: Date.now() - start, error: (e as Error).message });
			throw e;
		}
	};

	let created = false;
	try {
		await run('authenticate', getToken);
		await run('write', () => db.create(collection, id, { createdAt: new Date(), nonce: id }));
		created = true;
		await run('read', async () => {
			const doc = await db.get(collection, id);
			if (doc === null) throw new Error('document not found after write');
			if (doc['nonce'] !== id) throw new Error('read-back mismatch');
		});
	} catch {
		// failure already recorded in steps
	} finally {
		if (created) {
			try {
				await run('delete', () => db.delete(collection, id));
				await run('confirmDeleted', async () => {
					if ((await db.get(collection, id)) !== null) throw new Error('document still exists');
				});
			} catch {
				// recorded
			}
		}
	}

	const expected = ['authenticate', 'write', 'read', 'delete', 'confirmDeleted'];
	return {
		ok: expected.every((name) => steps.some((s) => s.step === name && s.ok)),
		steps,
	};
}
