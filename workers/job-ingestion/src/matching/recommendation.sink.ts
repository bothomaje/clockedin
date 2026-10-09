import type { RecommendationsRepository, UserScoredJob } from '../firestore/recommendations.repository';
import type { ActiveUser } from '../firestore/users.repository';
import type { JobSink, KeyedJob } from '../ingestion/sink';
import { RECOMMENDATION_LIMITS } from './limits';
import { MatchIndex } from './match-index';
import { jobText, scoreJob } from './scorer';

export interface MatchingStats {
	users: number;
	jobsSeen: number;
	scored: number;
	skippedDismissedOrSaved: number;
	belowMinScore: number;
	usersWithMatches: number;
	written: number;
}

/** Scores each job against candidate users, keeps each user's top matches, writes them in finish(). */
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
			usersWithMatches: 0,
			written: 0,
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
		await this.repo.upsertMany(items, this.now);
		this.stats.written = items.length;
	}
}
