import { Tone } from '@shared/ui/status-chip/status-chip';
import { JobStatus } from './job';

export const STATUS_META: Record<JobStatus, { label: string; tone: Tone }> = {
  [JobStatus.NEW]: { label: 'Not Applied', tone: 'neutral' },
  [JobStatus.APPLIED]: { label: 'Applied', tone: 'neutral' },
  [JobStatus.INTERVIEW]: { label: 'Interviewing', tone: 'signal' },
  [JobStatus.OFFER]: { label: 'Offer Received', tone: 'success' },
  [JobStatus.ACCEPTED]: { label: 'Accepted', tone: 'success' },
  [JobStatus.REJECTED]: { label: 'Rejected', tone: 'error' },
  [JobStatus.WITHDRAWN]: { label: 'Withdrawn', tone: 'neutral' },
  [JobStatus.ARCHIVED]: { label: 'Archived', tone: 'error' },
};

export function statusLabel(status: JobStatus): string {
  return STATUS_META[status].label;
}
