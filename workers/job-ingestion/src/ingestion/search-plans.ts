import type { JobSourceQuery } from '../sources/types';

export interface SearchPlan {
	queries: Array<Pick<JobSourceQuery, 'what' | 'where' | 'category'>>;
	pageSize: number;
	maxPagesPerQuery: number;
	maxPagesPerRun: number;
	maxDaysOld?: number;
}

export const SEARCH_PLANS: Record<string, SearchPlan> = {
	adzuna: {
		queries: [{ where: 'Gauteng' }, { where: 'Western Cape' }, { where: 'KwaZulu-Natal' }],
		pageSize: 50,
		maxPagesPerQuery: 2,
		maxPagesPerRun: 6,
		maxDaysOld: 7,
	},
	fake: {
		queries: [{}],
		pageSize: 2,
		maxPagesPerQuery: 3,
		maxPagesPerRun: 3,
	},
};
