import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Job, getLatestJobUpdate } from '../models/job';

@Component({
  selector: 'tr[app-job-card]',
  imports: [DatePipe],
  templateUrl: './job-card.html',
})
export class JobCard {
  job = input.required<Job>();
  view = output<Job>();
  edit = output<Job>();

  getLatestJobUpdate = getLatestJobUpdate;

  openUrl(): void {
    if (!this.job().url) return;
    window.open(this.job().url, '_blank');
  }
}
