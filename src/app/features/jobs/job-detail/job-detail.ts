import { Component, effect, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Job, JobStatus, getLatestJobUpdate } from '../models/job';

@Component({
  selector: 'app-job-detail',
  imports: [FormsModule, DatePipe],
  templateUrl: './job-detail.html',
})
export class JobDetail {
  job = input.required<Job>();
  close = output<void>();
  statusChange = output<JobStatus>();
  notesSave = output<string>();

  notesDraft = '';
  statuses = Object.values(JobStatus);
  getLatestJobUpdate = getLatestJobUpdate;

  constructor() {
    effect(() => {
      this.notesDraft = this.job().notes ?? '';
    });
  }
}
