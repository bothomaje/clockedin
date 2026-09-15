import { JobAnalysis } from './job-analysis.model';

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
}
