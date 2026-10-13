import { AI_LIMITS, RECOMMENDATION_LIMITS, SWEEP_LIMITS } from '../matching/limits';
import type { Caps } from './usage-meter';

export const SPARK_BUDGET = {
	daily: { reads: 50_000, writes: 20_000, deletes: 20_000 },
	workerShare: { reads: 0.4, writes: 0.5, deletes: 0.5 },
	runsPerDay: 2,
	defaultSubrequestLimit: 50,
	subrequestReserve: 3,
} as const;

export function parseSubrequestLimit(raw: string | undefined): number {
	const n = Number(raw);
	return Number.isInteger(n) && n > 0 ? n : SPARK_BUDGET.defaultSubrequestLimit;
}

export function runCaps(subrequestLimit: number, sourcePages: number): Caps {
	const { daily, workerShare, runsPerDay, subrequestReserve } = SPARK_BUDGET;
	const perRun = (k: 'reads' | 'writes' | 'deletes') => Math.floor((daily[k] * workerShare[k]) / runsPerDay);
	return {
		reads: perRun('reads'),
		writes: perRun('writes'),
		deletes: perRun('deletes'),
		requests: Math.max(5, subrequestLimit - sourcePages - AI_LIMITS.maxPerRun - subrequestReserve),
	};
}

export interface EstimateInput {
	activeUsers: number;
	recsPerUserPerRun?: number;
	avgStoredPerUser?: number;
	clientReadsPerUserPerDay?: number;
}

export interface Estimate {
	writes: number;
	reads: number;
	deletes: number;
	pct: { writes: number; reads: number; deletes: number };
	withinBudget: boolean;
}

export function estimateDaily(input: EstimateInput): Estimate {
	const { daily, runsPerDay } = SPARK_BUDGET;
	const users = Math.min(input.activeUsers, RECOMMENDATION_LIMITS.maxActiveUsersPerRun);
	const recs = Math.min(input.recsPerUserPerRun ?? RECOMMENDATION_LIMITS.maxPerUserPerRun, RECOMMENDATION_LIMITS.maxPerUserPerRun);
	const stored = input.avgStoredPerUser ?? RECOMMENDATION_LIMITS.maxStoredPerUser;
	const clientReads = input.clientReadsPerUserPerDay ?? 100;

	const sweepsPerDay = Math.min(users, SWEEP_LIMITS.maxUsersPerRun * runsPerDay);
	const writes = runsPerDay * users * recs + sweepsPerDay;
	const deletes = writes;
	const reads = runsPerDay * users * 2 + sweepsPerDay * stored + input.activeUsers * clientReads;

	const pct = {
		writes: writes / daily.writes,
		reads: reads / daily.reads,
		deletes: deletes / daily.deletes,
	};
	const { workerShare } = SPARK_BUDGET;
	return {
		writes,
		reads,
		deletes,
		pct,
		withinBudget: writes <= daily.writes * workerShare.writes && deletes <= daily.deletes * workerShare.deletes && reads <= daily.reads,
	};
}
