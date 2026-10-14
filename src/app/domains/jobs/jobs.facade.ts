import { inject, Service } from '@angular/core';
import { JobState } from './data/state/job-state';
import { Job, JobStatus } from './data/models/job';
import { JobAnalysis } from './data/models/job-analysis';

@Service()
export class JobsFacade {
  private state = inject(JobState);

  readonly jobs = this.state.jobs;
  readonly selectedJob = this.state.selectedJob;
  readonly error = this.state.error;

  adoptJob = (job: Job) => this.state.adoptJob(job);
  loadJobs = () => this.state.loadJobs();
  openJob = (id: string) => this.state.openJob(id);
  selectJob = (id: string) => this.state.selectJob(id);
  updateJobStatus = (id: string, status: JobStatus, note?: string) =>
    this.state.updateJobStatus(id, status, note);
  updateJob = (id: string, updates: Partial<Job>) => this.state.updateJob(id, updates);
  deleteJob = (id: string) => this.state.deleteJob(id);
  saveJobAnalysis = (id: string, analysis: JobAnalysis) => this.state.saveJobAnalysis(id, analysis);
}
