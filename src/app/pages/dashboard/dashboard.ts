import { Component, inject } from '@angular/core';
import { JobService } from '../../services/job-service';
import { Job } from '../../models/job.model';
import { UserService } from '../../services/user-service';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [AsyncPipe, FormsModule],
  selector: 'app-dashboard',
  // styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private jobService = inject(JobService);
  private userService = inject(UserService);

  editedJob?: Job;

  jobs = this.jobService.getJobs();

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
    this.jobService.addJob(this.editedJob!);
    this.editedJob = undefined;
    this.jobs = this.jobService.getJobs();
  }
}
