import type { FirestoreClient } from './client';

export interface DiscoveryKeys {
	dismissed: Set<string>;
	saved: Set<string>;
}

const keysOf = (value: unknown): Set<string> => new Set(value && typeof value === 'object' ? Object.keys(value) : []);

export class DiscoveryStateRepository {
	constructor(private readonly db: FirestoreClient) {}

	async load(uid: string): Promise<DiscoveryKeys> {
		const doc = await this.db.get(`users/${uid}/discovery`, 'state');
		return { dismissed: keysOf(doc?.['dismissed']), saved: keysOf(doc?.['saved']) };
	}
}
