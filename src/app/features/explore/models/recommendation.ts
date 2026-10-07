import { Job } from '../../jobs/models/job';

export interface Recommendation {
  id?: string;
  job: Job;
  score: number;
  matchedSignals: string[];
  generatedAt: Date;
  lastSeenAt: Date;
  expireAt: Date;
}

export interface DiscoveryState {
  dismissed: Record<string, Date>;
  saved: Record<string, Date>;
  refreshRequestedAt?: Date;
}

export function recommendationKey(job: Pick<Job, 'source'>): string | null {
  if (!job.source) return null;
  return `${job.source.provider}_${job.source.externalId}`.replace(/[^A-Za-z0-9_-]/g, '_');
}
