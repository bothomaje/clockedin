import { Component, inject } from '@angular/core';
import { JobService } from '../../services/job-service';
import { Job } from '../../models/job.model';

@Component({
  imports: [],
  selector: 'app-dashboard',
  // styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private jobService = inject(JobService);
  jobs: Job[] = this.jobService.getJobs();
}
