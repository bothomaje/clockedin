import type { SearchPlan } from '../ingestion/search-plans';
import type { MatchingProfile } from './profile';

export function planFromUsers(base: SearchPlan, profiles: MatchingProfile[]): SearchPlan {
	const counts = new Map<string, number>();
	for (const p of profiles) {
		const where = p.region ?? p.city;
		if (where) counts.set(where, (counts.get(where) ?? 0) + 1);
	}
	if (!counts.size) return base;

	const maxQueries = Math.max(1, Math.floor(base.maxPagesPerRun / base.maxPagesPerQuery));
	const queries = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxQueries)
		.map(([where]) => ({ where }));
	return { ...base, queries };
}
