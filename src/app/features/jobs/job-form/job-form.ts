import { Component, effect, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { APPLICATION_STATUSES, getDateApplied, Job, JobStatus } from '../models/job';
import { statusLabel } from '../../../shared/ui/status-chip/status-chip';

@Component({
  selector: 'app-job-form',
  imports: [FormsModule, DatePipe],
  templateUrl: './job-form.html',
})
export class JobForm {
  job = input.required<Job>();
  pipeline = input(true);
  showStatus = input(false);
  submitLabel = input('Save');
  save = output<Job>();
  cancel = output<void>();

  editedJob!: Job;
  status = JobStatus.APPLIED;
  statusOptions = APPLICATION_STATUSES;
  statusLabel = statusLabel;
  getDateApplied = getDateApplied;

  constructor() {
    effect(() => {
      this.editedJob = { ...this.job() };
    });
  }

  onSubmit(): void {
    const job = { ...this.editedJob };
    if (!job.id && this.showStatus()) {
      job.jobUpdates = [{ status: this.status, updatedAt: new Date() }];
    }
    this.save.emit(job);
  }

  toDate(value: string): Date {
    return new Date(value);
  }
}
