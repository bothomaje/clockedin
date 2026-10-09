import { Job, JobStatus } from '../../jobs/models/job';
import { Recommendation } from '../models/recommendation';

export function recommendationToJob(rec: Recommendation): Job {
  const { id: _id, ...job } = rec.job;
  return {
    ...job,
    origin: 'imported',
    jobUpdates: [{ status: JobStatus.NEW, updatedAt: new Date() }],
  };
}
