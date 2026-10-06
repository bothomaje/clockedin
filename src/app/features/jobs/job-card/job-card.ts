import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Job, getDateApplied, getLatestJobUpdate, getSavedAt } from '../models/job';
import { StatusChip } from '../../../shared/ui/status-chip/status-chip';
import { JobLocationPipe } from '../models/job-location.pipe';

export type JobRowVariant = 'application' | 'saved';

@Component({
  selector: 'tr[app-job-card]',
  imports: [DatePipe, StatusChip, JobLocationPipe],
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
