import { Service, inject, signal, computed } from '@angular/core';
import { JobRepository } from '../data/job.repository';
import { Job, JobStatus } from '../models/job';
import { JobAnalysis } from '../models/job-analysis';

@Service()
export class JobState {
  private jobRepository = inject(JobRepository);

  private jobsSignal = signal<Job[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal('');
  private selectedJobIdSignal = signal<string | undefined>(undefined);

  jobs = this.jobsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  selectedJob = computed(() =>
    this.jobsSignal().find((job) => job.id === this.selectedJobIdSignal()),
  );

  async loadJobs(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set('');

    try {
      this.jobsSignal.set(await this.jobRepository.getJobs());
    } catch (err) {
      this.errorSignal.set((err as Error).message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  selectJob(jobId: string | undefined): void {
    this.selectedJobIdSignal.set(jobId);
  }

  async openJob(jobId: string): Promise<Job | undefined> {
    this.selectedJobIdSignal.set(jobId);
    if (this.jobsSignal().length === 0) await this.loadJobs();
    return this.selectedJob();
  }

  async addJob(job: Job): Promise<Job> {
    const saved = await this.jobRepository.addJob(job);
    this.jobsSignal.update((jobs) => [...jobs, saved]);
    return saved;
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    await this.jobRepository.updateJob(jobId, updates);
    this.jobsSignal.update((jobs) =>
      jobs.map((job) => {
        if (job.id !== jobId) return job;
        const next = { ...job, ...updates };
        if (updates.location !== undefined) delete next.legacyLocation;
        return next;
      }),
    );
  }

  async saveJobAnalysis(jobId: string, analysis: JobAnalysis): Promise<void> {
    await this.jobRepository.saveJobAnalysis(jobId, analysis);
    this.jobsSignal.update((jobs) =>
      jobs.map((job) =>
        job.id === jobId ? { ...job, jobAnalysis: analysis, jobAnalysedAt: new Date() } : job,
      ),
    );
  }

  async updateJobStatus(jobId: string, newStatus: JobStatus, note?: string): Promise<void> {
    const entry = await this.jobRepository.updateJobStatus(jobId, newStatus, note);
    this.jobsSignal.update((jobs) =>
      jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              jobUpdates: [...job.jobUpdates, entry],
            }
          : job,
      ),
    );
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.jobRepository.deleteJob(jobId);
    this.jobsSignal.update((jobs) => jobs.filter((job) => job.id !== jobId));
    if (this.selectedJobIdSignal() === jobId) this.selectedJobIdSignal.set(undefined);
  }
}
