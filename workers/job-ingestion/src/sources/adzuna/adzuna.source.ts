import type { ExternalJobPage, JobSource, JobSourceQuery } from '../types';
import { ADZUNA_MAX_PAGE_SIZE, AdzunaClient } from './client';
import { mapAdzunaJob } from './mapper';
import type { AdzunaJob } from './types';

export function createAdzunaSource(appId: string, appKey: string): JobSource<AdzunaJob> {
	const client = new AdzunaClient(appId, appKey);

	return {
		id: 'adzuna',
		name: 'Adzuna',

		async fetchJobs(query: JobSourceQuery): Promise<ExternalJobPage<AdzunaJob>> {
			const pageSize = Math.min(Math.max(1, query.pageSize), ADZUNA_MAX_PAGE_SIZE);
			const body = await client.search({ ...query, pageSize });
			const jobs = Array.isArray(body.results) ? body.results : [];
			const total = typeof body.count === 'number' ? body.count : undefined;
			return {
				jobs,
				page: query.page,
				total,
				hasMore: total !== undefined ? query.page * pageSize < total : jobs.length === pageSize,
			};
		},

		mapJob: mapAdzunaJob,
	};
}
