import { JobAnalysis } from './job-analysis';

export enum JobStatus {
  NEW = 'new',
  APPLIED = 'applied',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
  WITHDRAWN = 'withdrawn',
  ARCHIVED = 'archived',
}

export interface JobUpdate {
  status: JobStatus;
  updatedAt: Date;
  note?: string;
}

export interface Job {
  id?: string;
  company?: string;
  role?: string;
  jobDescription: string;
  url?: string;
  location?: string;
  employmentType?: string;
  salary?: string;
  notes?: string;
  applicationDeadline?: Date | null;
  jobUpdates: JobUpdate[];
  generatedCoverLetter?: string;
  generatedCv?: string;
  jobAnalysis?: JobAnalysis | null;
  jobAnalysedAt?: Date | null;
  department?: string;
  dateApplied?: Date | null;
  source?: string;
  keyContact?: string;
  nextAction?: string;
}

export const SAVED_JOB_STATUSES: JobStatus[] = [JobStatus.NEW];
export const APPLICATION_STATUSES: JobStatus[] = Object.values(JobStatus).filter(
  (s) => s !== JobStatus.NEW,
);

export function getLatestJobUpdate(job: Job): JobUpdate {
  return job.jobUpdates.reduce((latest, current) =>
    current.updatedAt > latest.updatedAt ? current : latest,
  );
}

export function getSavedAt(job: Job): Date {
  return job.jobUpdates.reduce(
    (earliest, u) => (u.updatedAt < earliest ? u.updatedAt : earliest),
    job.jobUpdates[0].updatedAt,
  );
}
