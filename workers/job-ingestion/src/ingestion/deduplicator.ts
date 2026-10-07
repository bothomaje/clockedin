import type { Job } from '../model/job';

export function jobKey(job: Job): string {
	const { provider, externalId } = job.source!;
	return `${provider}_${externalId}`.replace(/[^A-Za-z0-9_-]/g, '_');
}
