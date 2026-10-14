import { Job } from '../../../jobs/data/models/job';

export interface AiInsight {
  matchScore: number;
  whyItMatches: string;
  potentialConcerns: string[];
  refinedAt: Date;
}

export interface Recommendation {
  id?: string;
  job: Job;
  score: number;
  matchedSignals: string[];
  ai?: AiInsight;
  generatedAt: Date;
  lastSeenAt: Date;
  expireAt: Date;
}

export interface DiscoveryState {
  dismissed: Record<string, Date>;
  saved: Record<string, Date>;
  enabled?: boolean;
  sources?: string[];
  lastActiveAt?: Date;
  refreshRequestedAt?: Date;
}

export function isVisible(
  rec: Recommendation,
  sources: readonly string[],
  now = new Date(),
): boolean {
  return rec.expireAt > now && (!rec.job.source || sources.includes(rec.job.source.provider));
}

export function recommendationKey(job: Pick<Job, 'source'>): string | null {
  if (!job.source) return null;
  return `${job.source.provider}_${job.source.externalId}`.replace(/[^A-Za-z0-9_-]/g, '_');
}
