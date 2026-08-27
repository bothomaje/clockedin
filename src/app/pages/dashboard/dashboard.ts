import { Component, inject } from '@angular/core';
import { JobService } from '../../services/job-service';
import { Job } from '../../models/job.model';
import { UserService } from '../../services/user-service';
import { AsyncPipe } from '@angular/common';

@Component({
  imports: [AsyncPipe],
  selector: 'app-dashboard',
  // styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private jobService = inject(JobService);
  private userService = inject(UserService);

  jobs = this.jobService.getJobs();
}
