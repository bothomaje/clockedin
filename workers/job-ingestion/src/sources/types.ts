import type { Job } from '../model/job';

export interface JobSourceQuery {
	page: number;
	pageSize: number;
	what?: string;
	where?: string;
	category?: string;
	maxDaysOld?: number;
}

export interface ExternalJobPage<E> {
	jobs: E[];
	page: number;
	total?: number;
	hasMore: boolean;
}

export interface JobSource<E = any> {
	readonly id: string;
	readonly name: string;
	fetchJobs(query: JobSourceQuery): Promise<ExternalJobPage<E>>;
	mapJob(externalJob: E): Job;
}

export class SourceError extends Error {
	constructor(
		readonly sourceId: string,
		message: string,
		readonly status?: number,
	) {
		super(message);
	}
}
