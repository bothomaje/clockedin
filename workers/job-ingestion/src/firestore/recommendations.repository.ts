import type { Job } from '../model/job';
import { RECOMMENDATION_LIMITS } from '../matching/limits';
import type { FirestoreClient } from './client';

const DAY_MS = 86_400_000;
const BATCH_SIZE = 500;

export interface ScoredJob {
	key: string;
	job: Job;
	score: number;
	matchedSignals: string[];
}

export class RecommendationsRepository {
	constructor(private readonly db: FirestoreClient) {}

	async upsert(uid: string, items: ScoredJob[], now: Date): Promise<void> {
		const expireAt = new Date(now.getTime() + RECOMMENDATION_LIMITS.freshnessDays * DAY_MS);
		const writes = items.map(({ key, job, score, matchedSignals }) => ({
			collection: `users/${uid}/recommendations`,
			id: key,
			data: {
				job: { ...job, jobDescription: job.jobDescription.slice(0, RECOMMENDATION_LIMITS.maxDescriptionChars) },
				score,
				matchedSignals,
				generatedAt: now,
				lastSeenAt: now,
				expireAt,
			},
		}));
		for (let i = 0; i < writes.length; i += BATCH_SIZE) {
			await this.db.commit(writes.slice(i, i + BATCH_SIZE));
		}
	}
}
