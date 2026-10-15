import { inject, Service } from '@angular/core';
import { JobState } from './state/job-state';
import { Job, JobStatus } from './models/job';
import { JobAnalysis } from './models/job-analysis';
import { WriteBatch } from 'firebase/firestore';
import { JobRepository } from './repositories/job.repository';

@Service()
export class JobsFacade {
  private state = inject(JobState);
  private repository = inject(JobRepository);

  readonly jobs = this.state.jobs;
  readonly selectedJob = this.state.selectedJob;
  readonly error = this.state.error;

  adoptJob = (job: Job) => this.state.adoptJob(job);
  loadJobs = () => this.state.loadJobs();
  openJob = (id: string) => this.state.openJob(id);
  selectJob = (id: string) => this.state.selectJob(id);
  updateJob = (id: string, updates: Partial<Job>) => this.state.updateJob(id, updates);
  updateJobStatus = (id: string, status: JobStatus, note?: string) =>
    this.state.updateJobStatus(id, status, note);
  deleteJob = (id: string) => this.state.deleteJob(id);
  saveGeneratedDocument = (
    jobId: string,
    kind: 'cv' | 'coverLetter',
    content: Job['generatedCv'],
  ) =>
    this.state.updateJob(
      jobId,
      kind === 'cv' ? { generatedCv: content } : { generatedCoverLetter: content },
    );
  saveJobAnalysis = (id: string, analysis: JobAnalysis) => this.state.saveJobAnalysis(id, analysis);
  addJobInBatch = (batch: WriteBatch, job: Job) => this.repository.addJobInBatch(batch, job);
}
