import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Job, getDateApplied, getLatestJobUpdate, getSavedAt } from '../../data/models/job';
import { JobLocationPipe } from '../../util/job-location.pipe';
import { JobStatusChip } from '../job-status-chip/job-status-chip';

export type JobRowVariant = 'application' | 'saved';

@Component({
  selector: 'tr[app-job-card]',
  imports: [DatePipe, JobStatusChip, JobLocationPipe],
  templateUrl: './job-card.html',
  host: {
    role: 'link',
    tabindex: '0',
    '(click)': 'view.emit(job())',
    '(keydown.enter)': 'view.emit(job())',
  },
})
export class JobCard {
  job = input.required<Job>();
  variant = input<JobRowVariant>('application');
  view = output<Job>();
  edit = output<Job>();

  getLatestJobUpdate = getLatestJobUpdate;
  getSavedAt = getSavedAt;
  getDateApplied = getDateApplied;

  dateFormat(date?: Date | null): string {
    return date && new Date(date).getFullYear() !== new Date().getFullYear() ? 'MMM d, y' : 'MMM d';
  }
}
