import { Component, inject, OnInit, output } from '@angular/core';
import { JobState } from '../state/job-state';
import { Job } from '../models/job';
import { JobCard } from '../job-card/job-card';

@Component({
  selector: 'app-job-list',
  imports: [JobCard],
  templateUrl: './job-list.html',
})
export class JobList implements OnInit {
  private jobState = inject(JobState);

  view = output<Job>();
  edit = output<Job>();

  jobs = this.jobState.jobs;

  ngOnInit(): void {
    this.jobState.loadJobs();
  }
}
