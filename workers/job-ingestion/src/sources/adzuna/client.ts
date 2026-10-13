import { JobSourceQuery, SourceError } from '../types';
import type { AdzunaSearchResponse } from './types';

const BASE_URL = 'https://api.adzuna.com/v1/api/jobs';
const COUNTRY = 'za';
const TIMEOUT_MS = 10_000;

export const ADZUNA_MAX_PAGE_SIZE = 50;

export class AdzunaClient {
	constructor(
		private readonly appId: string,
		private readonly appKey: string,
	) {}

	async search(query: JobSourceQuery): Promise<AdzunaSearchResponse> {
		const params = new URLSearchParams({
			app_id: this.appId,
			app_key: this.appKey,
			results_per_page: String(Math.min(Math.max(1, query.pageSize), ADZUNA_MAX_PAGE_SIZE)),
			sort_by: 'date',
		});
		if (query.what) params.set('what', query.what);
		if (query.where) params.set('where', query.where);
		if (query.category) params.set('category', query.category);
		if (query.maxDaysOld !== undefined) params.set('max_days_old', String(query.maxDaysOld));

		const url = `${BASE_URL}/${COUNTRY}/search/${Math.max(1, query.page)}?${params}`;

		let res: Response;
		try {
			res = await fetch(url, {
				headers: { accept: 'application/json' },
				signal: AbortSignal.timeout(TIMEOUT_MS),
			});
		} catch {
			throw new SourceError('adzuna', 'Adzuna request failed: network error or timeout');
		}
		if (!res.ok) throw new SourceError('adzuna', `Adzuna request failed: ${res.status}`, res.status);

		let body: unknown;
		try {
			body = await res.json();
		} catch {
			throw new SourceError('adzuna', 'Adzuna returned invalid JSON');
		}
		if (!body || typeof body !== 'object') throw new SourceError('adzuna', 'Adzuna returned an unexpected response');
		return body as AdzunaSearchResponse;
	}
}
