import { Job, JobStatus } from './../../../domains/jobs/data/models/job';
import { DocumentData, Timestamp } from 'firebase/firestore';
import { AiInsight, Recommendation } from '../models/recommendation';

const toDate = (value: unknown): Date | null =>
  !value ? null : value instanceof Timestamp ? value.toDate() : (value as Date);

function toAiInsight(value: unknown): AiInsight | undefined {
  const v = value as Partial<Record<keyof AiInsight, unknown>> | null | undefined;
  if (!v || typeof v['whyItMatches'] !== 'string' || typeof v['matchScore'] !== 'number')
    return undefined;
  return {
    matchScore: v['matchScore'],
    whyItMatches: v['whyItMatches'],
    potentialConcerns: Array.isArray(v['potentialConcerns'])
      ? (v['potentialConcerns'] as string[])
      : [],
    refinedAt: toDate(v['refinedAt']) ?? new Date(0),
  };
}

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
    ai: toAiInsight(data['ai']),
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
