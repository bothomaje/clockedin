import { DocumentData, Timestamp } from 'firebase/firestore';
import { Job, JobStatus } from '../../jobs/models/job';
import { Recommendation } from '../models/recommendation';

const toDate = (value: unknown): Date | null =>
  !value ? null : value instanceof Timestamp ? value.toDate() : (value as Date);

/** Reads a users/{uid}/recommendations document. The document ID is the recommendation key. */
export function toRecommendation(id: string, data: DocumentData): Recommendation {
  const job = (data['job'] ?? {}) as Partial<Job>;
  return {
    id,
    job: {
      ...job,
      jobDescription: job.jobDescription ?? '',
      jobUpdates: [],
      postedAt: toDate(job.postedAt),
    },
    score: typeof data['score'] === 'number' ? data['score'] : 0,
    matchedSignals: Array.isArray(data['matchedSignals']) ? data['matchedSignals'] : [],
    generatedAt: toDate(data['generatedAt']) ?? new Date(0),
    lastSeenAt: toDate(data['lastSeenAt']) ?? new Date(0),
    expireAt: toDate(data['expireAt']) ?? new Date(0),
  };
}

export function recommendationToJob(rec: Recommendation): Job {
  const { id: _id, ...job } = rec.job;
  return {
    ...job,
    origin: 'imported',
    jobUpdates: [{ status: JobStatus.NEW, updatedAt: new Date() }],
  };
}

export function providerLabel(provider?: string): string {
  return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : '';
}
