import type { Job } from '../model/job';

const MAX = { role: 200, company: 200, jobDescription: 20_000, salary: 100, employmentType: 100 };

const trimTo = (value: string | undefined, max: number): string | undefined =>
	value === undefined ? undefined : value.trim().slice(0, max);

export function normaliseJob(job: Job): Job {
	return {
		...job,
		role: trimTo(job.role, MAX.role),
		company: trimTo(job.company, MAX.company),
		jobDescription: trimTo(job.jobDescription, MAX.jobDescription) ?? '',
		salary: trimTo(job.salary, MAX.salary),
		employmentType: trimTo(job.employmentType, MAX.employmentType),
		url: job.url?.trim(),
		source: job.source && {
			provider: job.source.provider.trim(),
			externalId: job.source.externalId.trim(),
			url: job.source.url.trim(),
		},
	};
}
