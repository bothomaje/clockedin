import type { Job } from '../model/job';

const MAX_URL_LENGTH = 2000;

function isHttpUrl(value: string | undefined): boolean {
	if (!value || value.length > MAX_URL_LENGTH) return false;
	try {
		const { protocol } = new URL(value);
		return protocol === 'https:' || protocol === 'http:';
	} catch {
		return false;
	}
}

export function validateJob(job: Job): string | null {
	if (!job.source?.provider) return 'missing_provider';
	if (!job.source.externalId) return 'missing_external_id';
	if (!job.role) return 'missing_title';
	if (!job.company) return 'missing_company';
	if (!job.jobDescription) return 'missing_description';
	if (!isHttpUrl(job.url) || !isHttpUrl(job.source.url)) return 'invalid_url';
	return null;
}
