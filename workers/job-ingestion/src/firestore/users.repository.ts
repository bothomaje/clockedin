import { RECOMMENDATION_LIMITS } from '../matching/limits';
import { toMatchingProfile, type MatchingProfile } from '../matching/profile';
import type { FirestoreClient } from './client';

export interface DiscoveryKeys {
	dismissed: Set<string>;
	saved: Set<string>;
}

export interface ActiveUser {
	profile: MatchingProfile;
	keys: DiscoveryKeys;
}

const DAY_MS = 86_400_000;
const STATE_PATH = /^users\/([^/]+)\/discovery\/state$/;
const keysOf = (value: unknown): Set<string> => new Set(value && typeof value === 'object' ? Object.keys(value) : []);

export class UsersRepository {
	constructor(private readonly db: FirestoreClient) {}

	async loadActive(now: Date): Promise<ActiveUser[]> {
		const cutoff = new Date(now.getTime() - RECOMMENDATION_LIMITS.activeWindowDays * DAY_MS);
		const states = await this.db.collectionGroup(
			'discovery',
			'lastActiveAt',
			'GREATER_THAN_OR_EQUAL',
			cutoff,
			RECOMMENDATION_LIMITS.maxActiveUsersPerRun,
			'DESCENDING',
		);

		const enabled = states.flatMap((s) => {
			const uid = STATE_PATH.exec(s.path)?.[1];
			return uid && s.data['enabled'] === true ? [{ uid, data: s.data }] : [];
		});
		const users = await this.db.getMany(enabled.map((e) => `users/${e.uid}`));

		return enabled.flatMap(({ uid, data }) => {
			const user = users.get(`users/${uid}`);
			if (!user) return [];
			return [{ profile: toMatchingProfile(uid, user), keys: { dismissed: keysOf(data['dismissed']), saved: keysOf(data['saved']) } }];
		});
	}
}
