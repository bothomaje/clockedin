import { Component, inject, OnInit, signal } from '@angular/core';
import { JobState } from '../../jobs/state/job-state';
import { DocumentState } from '../../documents/state/document-state';
import { JobList } from '../../jobs/job-list/job-list';
import { JobForm } from '../../jobs/job-form/job-form';
import { JobDetail } from '../../jobs/job-detail/job-detail';
import { JobAnalysisPanel } from '../../documents/job-analysis-panel/job-analysis-panel';
import { CvGenerationPanel } from '../../documents/cv-generation-panel/cv-generation-panel';
import { CoverLetterPanel } from '../../documents/cover-letter-panel/cover-letter-panel';
import { ProfileState } from '../../profile/state/profile-state';
import { Job, JobStatus } from '../../jobs/models/job';
import { JobAnalysis } from '../../jobs/models/job-analysis';
import { GeneratedCv } from '../../documents/models/generated-cv';

@Component({
  imports: [JobList, JobForm, JobDetail, JobAnalysisPanel, CvGenerationPanel, CoverLetterPanel],
  selector: 'app-dashboard',
  templateUrl: './dashboard-page.html',
})
export class Dashboard implements OnInit {
  protected jobState = inject(JobState);
  protected documentState = inject(DocumentState);
  protected profileState = inject(ProfileState);

  editedJob = signal<Job | undefined>(undefined);

  jobAnalysis = signal<JobAnalysis | undefined>(undefined);
  generatedCv = signal<GeneratedCv | undefined>(undefined);

  async ngOnInit() {
    await this.profileState.load();
  }

  beginJobAdd(): void {
    this.editedJob.set({ company: '', role: '', jobDescription: '', jobUpdates: [] });
  }

  onEditJob(job: Job): void {
    this.editedJob.set(job);
  }

  cancelJobEdit(): void {
    this.editedJob.set(undefined);
  }

  async onSaveJob(job: Job): Promise<void> {
    if (job.id) {
      const { id, ...updates } = job;
      await this.jobState.updateJob(id, updates);
    } else {
      job.jobUpdates = [{ status: JobStatus.NEW, updatedAt: new Date() }];
      await this.jobState.addJob(job);
    }
    this.editedJob.set(undefined);
  }

  onViewJob(job: Job): void {
    this.jobState.selectJob(job.id);
    this.jobAnalysis.set(job.jobAnalysis ?? undefined);
    this.generatedCv.set(undefined);
    this.documentState.loadForJob(job.id!);
  }

  onCloseDetail(): void {
    this.jobState.selectJob(undefined);
  }

  async onStatusChange(job: Job, status: JobStatus): Promise<void> {
    await this.jobState.updateJobStatus(job.id!, status);
  }

  async onNotesSave(job: Job, notes: string): Promise<void> {
    await this.jobState.updateJob(job.id!, { notes });
  }
}
