import type { DiscoveryKeys } from '../firestore/discovery-state.repository';
import type { RecommendationsRepository, ScoredJob } from '../firestore/recommendations.repository';
import type { JobSink, KeyedJob } from '../ingestion/sink';
import type { Job } from '../model/job';
import { RECOMMENDATION_LIMITS } from './limits';

export type ScoreFn = (job: Job) => { score: number; matchedSignals: string[] };

export interface RecommendationSinkStats {
	written: number;
	skippedDismissedOrSaved: number;
	belowMinScore: number;
	overRunCap: number;
}

export class RecommendationSink implements JobSink {
	readonly stats: RecommendationSinkStats = { written: 0, skippedDismissedOrSaved: 0, belowMinScore: 0, overRunCap: 0 };
	private readonly now = new Date();

	constructor(
		private readonly uid: string,
		private readonly repo: RecommendationsRepository,
		private readonly state: DiscoveryKeys,
		private readonly score: ScoreFn,
	) {}

	async accept(jobs: KeyedJob[]): Promise<void> {
		const batch: ScoredJob[] = [];
		for (const { key, job } of jobs) {
			if (this.state.dismissed.has(key) || this.state.saved.has(key)) {
				this.stats.skippedDismissedOrSaved++;
				continue;
			}
			const { score, matchedSignals } = this.score(job);
			if (score < RECOMMENDATION_LIMITS.minScore) {
				this.stats.belowMinScore++;
				continue;
			}
			if (this.stats.written + batch.length >= RECOMMENDATION_LIMITS.maxPerUserPerRun) {
				this.stats.overRunCap++;
				continue;
			}
			batch.push({ key, job, score, matchedSignals });
		}
		await this.repo.upsert(this.uid, batch, this.now);
		this.stats.written += batch.length;
	}
}
