import type { Job } from '../../model/job';
import type { ExternalJobPage, JobSource, JobSourceQuery } from '../types';

interface FakeExternalJob {
	uid: string;
	heading: string;
	employer: string;
	body: string;
	link: string;
}

const FAKE_JOBS: FakeExternalJob[] = [
	{ uid: 'f-1', heading: 'Test Engineer', employer: 'Fake Co', body: 'Write tests.', link: 'https://example.com/jobs/f-1' },
	{ uid: 'f-2', heading: 'Test Analyst', employer: 'Fake Co', body: 'Analyse tests.', link: 'https://example.com/jobs/f-2' },
	{ uid: 'f-3', heading: 'Test Manager', employer: 'Mock Ltd', body: 'Manage tests.', link: 'https://example.com/jobs/f-3' },
];

/** Proves the adapter contract. Registered in staging only. */
export const fakeSource: JobSource<FakeExternalJob> = {
	id: 'fake',
	name: 'Fake (test)',

	async fetchJobs(query: JobSourceQuery): Promise<ExternalJobPage<FakeExternalJob>> {
		const start = (Math.max(1, query.page) - 1) * query.pageSize;
		return {
			jobs: FAKE_JOBS.slice(start, start + query.pageSize),
			page: query.page,
			total: FAKE_JOBS.length,
			hasMore: start + query.pageSize < FAKE_JOBS.length,
		};
	},

	mapJob(job: FakeExternalJob): Job {
		return {
			company: job.employer,
			role: job.heading,
			jobDescription: job.body,
			url: job.link,
			jobUpdates: [],
			source: { provider: 'fake', externalId: job.uid, url: job.link },
			origin: 'imported',
		};
	},
};
