import type { FirestoreClient } from '../firestore/client';
import type { UsageMeter } from '../budget/usage-meter';
import { RECOMMENDATION_LIMITS, SWEEP_LIMITS } from '../matching/limits';

const DAY_MS = 86_400_000;

export interface SweepCandidate {
	uid: string;
	lastSweptAt: Date | null;
}

export interface SweepStats {
	due: number;
	swept: number;
	expiredDeleted: number;
	overflowDeleted: number;
}

export class ExpirySweeper {
	constructor(
		private readonly db: FirestoreClient,
		private readonly meter: UsageMeter,
	) {}

	async sweep(candidates: SweepCandidate[], now: Date): Promise<SweepStats> {
		const cutoff = now.getTime() - SWEEP_LIMITS.intervalDays * DAY_MS;
		const due = candidates
			.filter((c) => !c.lastSweptAt || c.lastSweptAt.getTime() < cutoff)
			.sort((a, b) => (a.lastSweptAt?.getTime() ?? 0) - (b.lastSweptAt?.getTime() ?? 0));

		const stats: SweepStats = { due: due.length, swept: 0, expiredDeleted: 0, overflowDeleted: 0 };
		const requestBudget = Math.floor(this.meter.remaining('requests') * SWEEP_LIMITS.requestShare);
		const readBudget = Math.min(SWEEP_LIMITS.maxReadsPerRun, this.meter.remaining('reads'));
		const deleteBudget = this.meter.remaining('deletes');

		const paths: string[] = [];
		const swept: string[] = [];
		let reads = 0;

		for (const { uid } of due.slice(0, Math.min(SWEEP_LIMITS.maxUsersPerRun, requestBudget))) {
			if (reads >= readBudget) break;
			const docs = await this.db.list(`users/${uid}/recommendations`, ['expireAt', 'score'], SWEEP_LIMITS.listPageSize);
			reads = docs.length;

			const isExpired = (d: { data: Record<string, unknown> }) => {
				const at = d.data['expireAt'];
				return at instanceof Date && at <= now;
			};
			const expired = docs.filter(isExpired);
			const overflow = docs
				.filter((d) => !isExpired(d))
				.sort((a, b) => Number(b.data['score'] ?? 0) - Number(a.data['score'] ?? 0))
				.slice(RECOMMENDATION_LIMITS.maxStoredPerUser);

			if (paths.length + expired.length + overflow.length > deleteBudget) break;
			paths.push(...expired.map((d) => d.path), ...overflow.map((d) => d.path));
			stats.expiredDeleted += expired.length;
			stats.overflowDeleted += overflow.length;
			swept.push(uid);
		}

		await this.db.deleteDocs(paths);
		await this.db.commit(
			swept.map((uid) => ({
				collection: `users/${uid}/discovery`,
				id: 'state',
				data: { lastSweptAt: now },
				fieldPaths: ['lastSweptAt'],
			})),
		);
		stats.swept = swept.length;
		return stats;
	}
}
