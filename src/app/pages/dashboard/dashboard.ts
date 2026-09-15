import { Component, inject } from '@angular/core';
import { JobService } from '../../services/job-service';
import { Job, JobStatus, JobUpdate } from '../../models/job.model';
import { UserService } from '../../services/user-service';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user/user.model';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  imports: [AsyncPipe, FormsModule, DatePipe, MarkdownComponent],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private jobService = inject(JobService);

  editedJob?: Job;
  viewedJob?: Job;

  jobs = this.jobService.getJobs();

  notesDraft = '';

  toDate(value: string): Date {
    return new Date(value);
  }

  beginJobEdit() {
    this.editedJob = {
      company: '',
      role: '',
      jobDescription: '',
      jobUpdates: [],
    };
  }

  cancelJobEdit() {
    this.editedJob = undefined;
  }

  saveJob() {
    this.editedJob!.jobUpdates = [{ status: JobStatus.NEW, updatedAt: new Date() }];
    this.jobService.addJob(this.editedJob!);
    this.editedJob = undefined;
    this.jobs = this.jobService.getJobs();
  }

  toggleDetails(job: Job) {
    if (this.viewedJob?.id === job.id) {
      this.viewedJob = undefined;
    } else {
      this.viewedJob = job;
      this.notesDraft = job.notes ?? '';
    }
  }

  async saveNotes() {
    if (!this.viewedJob?.id) return;
    await this.jobService.updateJob(this.viewedJob.id, { notes: this.notesDraft });
    this.viewedJob.notes = this.notesDraft;
  }

  getLatestJobUpdate(job: Job): JobUpdate {
    return job.jobUpdates.reduce((latest, current) => {
      return current.updatedAt > latest.updatedAt ? current : latest;
    });
  }

  async updateJobStatus(job: Job, newStatus: JobStatus) {
    await this.jobService.updateJobStatus(job.id!, newStatus);
    job.jobUpdates.push({ status: newStatus, updatedAt: new Date() });
  }

  getStatuses() {
    return Object.values(JobStatus);
  }
}
