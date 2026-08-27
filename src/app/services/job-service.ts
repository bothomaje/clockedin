import { Service } from '@angular/core';
import { Job, JobStatus } from '../models/job.model';

@Service()
export class JobService {
  private jobs: Job[] = [
    {
      id: '1',
      company: 'ACME Corp',
      role: 'Software Engineer',
      jobDescription: 'Develop and maintain web applications.',
      jobUpdates: [
        { status: JobStatus.NEW, updatedAt: new Date('2024-01-01') },
        { status: JobStatus.APPLIED, updatedAt: new Date('2024-01-01') },
      ],
    },
    {
      id: '2',
      company: 'Globex Corporation',
      role: 'Frontend Developer',
      jobDescription: 'Work on the user interface of our web applications.',
      jobUpdates: [
        { status: JobStatus.NEW, updatedAt: new Date('2024-01-01') },
        { status: JobStatus.APPLIED, updatedAt: new Date('2024-01-01') },
      ],
    },
  ];

  getJobs(): Promise<Job[]> {
    return Promise.resolve(this.jobs);
  }

  addJob(job: Job): Promise<Job> {
    this.jobs.push({ ...job, id: Date.now().toString(), role: 'Test Role', company: 'ACME Corp' });
    return Promise.resolve(job);
  }

  updateJobStatus(jobId: string, newStatus: JobStatus): Promise<Job | undefined> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.jobUpdates.push({ updatedAt: new Date(), status: newStatus });
      return Promise.resolve(job);
    } else {
      return Promise.resolve(undefined);
    }
  }
}
