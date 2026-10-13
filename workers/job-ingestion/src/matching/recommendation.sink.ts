import type { RecommendationsRepository, UserScoredJob } from '../firestore/recommendations.repository';
import type { ActiveUser } from '../firestore/users.repository';
import type { JobSink, KeyedJob } from '../ingestion/sink';
import { AiRefiner } from './ai-refiner';
import { AI_LIMITS, RECOMMENDATION_LIMITS } from './limits';
import { MatchIndex } from './match-index';
import { jobText, scoreJob } from './scorer';

export interface MatchingStats {
	users: number;
	jobsSeen: number;
	scored: number;
	skippedDismissedOrSaved: number;
	belowMinScore: number;
	droppedByBudget: number;
	usersWithMatches: number;
	written: number;
	aiRefined: number;
	aiFailed: number;
}

export class MatchingSink implements JobSink {
	readonly stats: MatchingStats;
	private readonly index: MatchIndex;
	private readonly noSignals: ActiveUser[];
	private readonly byUid = new Map<string, ActiveUser>();
	private readonly pending = new Map<string, UserScoredJob[]>();

	constructor(
		users: ActiveUser[],
		private readonly repo: RecommendationsRepository,
		private readonly now: Date,
		private readonly writeBudget: number,
		private readonly refiner?: AiRefiner,
	) {
		users.forEach((u) => this.byUid.set(u.profile.uid, u));
		this.index = new MatchIndex(users.map((u) => u.profile));
		this.noSignals = this.index.withoutSignals().map((p) => this.byUid.get(p.uid)!);
		this.stats = {
			users: users.length,
			jobsSeen: 0,
			scored: 0,
			skippedDismissedOrSaved: 0,
			belowMinScore: 0,
			droppedByBudget: 0,
			usersWithMatches: 0,
			written: 0,
			aiRefined: 0,
			aiFailed: 0,
		};
	}

	async accept(jobs: KeyedJob[]): Promise<void> {
		for (const { key, job } of jobs) {
			this.stats.jobsSeen++;
			const text = jobText(job);
			const candidates = new Set([...this.index.candidates(text.allTokens).map((p) => this.byUid.get(p.uid)!), ...this.noSignals]);

			for (const user of candidates) {
				if (user.keys.dismissed.has(key) || user.keys.saved.has(key)) {
					this.stats.skippedDismissedOrSaved++;
					continue;
				}
				this.stats.scored++;
				const { score, matchedSignals } = scoreJob(user.profile, job, text);
				if (score < RECOMMENDATION_LIMITS.minScore) {
					this.stats.belowMinScore++;
					continue;
				}
				const list = this.pending.get(user.profile.uid) ?? [];
				list.push({ uid: user.profile.uid, key, job, score, matchedSignals });
				this.pending.set(user.profile.uid, list);
			}
		}
	}

	async finish(): Promise<void> {
		const items: UserScoredJob[] = [];
		for (const list of this.pending.values()) {
			list.sort((a, b) => b.score - a.score);
			items.push(...list.slice(0, RECOMMENDATION_LIMITS.maxPerUserPerRun));
		}
		this.stats.usersWithMatches = this.pending.size;
		items.sort((a, b) => b.score - a.score);
		this.stats.droppedByBudget = Math.max(0, items.length - this.writeBudget);
		items.length = Math.min(items.length, Math.max(0, this.writeBudget));
		await this.refine(items);
		await this.repo.upsertMany(items, this.now);
		this.stats.written = items.length;
	}

	private async refine(items: UserScoredJob[]): Promise<void> {
		if (!this.refiner) return;
		const byUser = new Map<string, UserScoredJob[]>();
		for (const item of items) {
			const list = byUser.get(item.uid) ?? [];
			if (list.length < AI_LIMITS.maxPerUserPerRun) list.push(item);
			byUser.set(item.uid, list);
		}
		const queue: UserScoredJob[] = [];
		for (let rank = 0; rank < AI_LIMITS.maxPerUserPerRun; rank++) {
			for (const list of byUser.values()) if (list[rank]) queue.push(list[rank]);
		}
		const batch = queue.slice(0, AI_LIMITS.maxPerRun);
		for (let i = 0; i < batch.length; i += AI_LIMITS.concurrency) {
			await Promise.all(
				batch.slice(i, i + AI_LIMITS.concurrency).map(async (item) => {
					const insight = await this.refiner!.refine(this.byUid.get(item.uid)!.profile, item.job);
					if (!insight) return void this.stats.aiFailed++;
					item.ai = insight;
					item.score = Math.round(AI_LIMITS.blend * insight.matchScore + (1 - AI_LIMITS.blend) * item.score);
					this.stats.aiRefined++;
				}),
			);
		}
	}
}
