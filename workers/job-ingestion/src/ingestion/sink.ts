import type { Job } from '../model/job';

export interface KeyedJob {
	key: string;
	job: Job;
}

export interface JobSink {
	accept(jobs: KeyedJob[]): Promise<void>;
}

export class CollectingSink implements JobSink {
	readonly items: KeyedJob[] = [];

	async accept(jobs: KeyedJob[]): Promise<void> {
		this.items.push(...jobs);
	}
}
