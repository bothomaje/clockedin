import { Component, computed, input } from '@angular/core';
import { JobStatus } from '../../../features/jobs/models/job';

const STATUS_META: Record<JobStatus, { label: string; cls: string }> = {
  [JobStatus.NEW]: { label: 'Not Applied', cls: '' },
  [JobStatus.APPLIED]: { label: 'Applied', cls: '' },
  [JobStatus.INTERVIEW]: { label: 'Interviewing', cls: 'clk-chip--signal' },
  [JobStatus.OFFER]: { label: 'Offer Received', cls: 'clk-chip--success' },
  [JobStatus.ACCEPTED]: { label: 'Accepted', cls: 'clk-chip--success' },
  [JobStatus.REJECTED]: { label: 'Rejected', cls: 'clk-chip--error' },
  [JobStatus.WITHDRAWN]: { label: 'Withdrawn', cls: '' },
  [JobStatus.ARCHIVED]: { label: 'Archived', cls: 'clk-chip--error' },
};

export function statusLabel(status: JobStatus): string {
  return STATUS_META[status].label;
}

@Component({
  selector: 'app-status-chip',
  templateUrl: './status-chip.html',
})
export class StatusChip {
  status = input.required<JobStatus>();
  meta = computed(() => STATUS_META[this.status()]);
}
