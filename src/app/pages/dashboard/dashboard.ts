import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { JobService } from '../../services/job-service';
import { Job, JobStatus, JobUpdate } from '../../models/job.model';
import { UserService } from '../../services/user-service';
import { AsyncPipe, DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user/user.model';
import { MarkdownComponent } from 'ngx-markdown';
import { AiService } from '../../services/ai-service';
import { JobAnalysis } from '../../models/job-analysis.model';
import { CareerProfile } from '../../models/user/career/career-profile.model';
import { GeneratedDocument } from '../../models/ai/generated-document.model';
import { validateCv } from '../../ai/cv-validator';
import { renderCvMarkdown } from '../../ai/cv-renderer';
import { PdfService } from '../../services/pdf-service';
import { GeneratedCv } from '../../models/ai/generated-cv.model';
import { validateCoverLetter } from '../../ai/cover-letter-validator';
import { buildCoverLetterPayload, renderCoverLetterMarkdown } from '../../ai/cover-letter-renderer';
import { DEFAULT_CV_TEMPLATE } from '../../templates/default-cv.typst';
import { DEFAULT_COVER_LETTER_TEMPLATE } from '../../templates/default-cover-letter.typst';
import { buildCvPayload } from '../../ai/cv-payload';
import { GeneratedCoverLetter } from '../../models/ai/generated-cover-letter.model';

@Component({
  imports: [AsyncPipe, FormsModule, DatePipe, MarkdownComponent, JsonPipe],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private jobService = inject(JobService);
  private aiService = inject(AiService);
  private userService = inject(UserService);
  private pdfService = inject(PdfService);
  private cdr = inject(ChangeDetectorRef);

  editedJob?: Job;
  viewedJob?: Job;

  jobs = this.jobService.getJobs();

  notesDraft = '';

  jobAnalysis?: JobAnalysis;
  aiError = '';
  isAnalysing = false;

  user?: User;
  careerProfiles: CareerProfile[] = [];
  selectedProfileId = '';

  cvDocuments: GeneratedDocument[] = [];
  activeCv?: GeneratedDocument;
  isGeneratingCv = false;
  cvError = '';

  coverLetterDocuments: GeneratedDocument[] = [];
  activeCoverLetter?: GeneratedDocument;
  isGeneratingCoverLetter = false;
  coverLetterError = '';

  isDownloading = false;
  downloadError = '';

  async ngOnInit() {
    this.user = await this.userService.getUser();
    this.careerProfiles = this.user?.career?.careerProfiles ?? [];
    this.cdr.markForCheck();
  }

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

  async saveJob() {
    this.editedJob!.jobUpdates = [{ status: JobStatus.NEW, updatedAt: new Date() }];
    await this.jobService.addJob(this.editedJob!);
    this.editedJob = undefined;
    this.jobs = this.jobService.getJobs();
    this.cdr.markForCheck();
  }

  async toggleDetails(job: Job) {
    if (this.viewedJob?.id === job.id) {
      this.viewedJob = undefined;
      this.cvDocuments = [];
      this.activeCv = undefined;
      this.coverLetterDocuments = [];
      this.activeCoverLetter = undefined;
      this.jobAnalysis = undefined;
    } else {
      this.viewedJob = job;
      this.notesDraft = job.notes ?? '';
      this.jobAnalysis = job.jobAnalysis ?? undefined;
      this.aiError = '';
      this.cvError = '';
      this.coverLetterError = '';
      this.downloadError = '';
      await this.loadCvDocuments();
      await this.loadCoverLetterDocuments();
    }
  }

  async saveNotes() {
    if (!this.viewedJob?.id) return;
    await this.jobService.updateJob(this.viewedJob.id, { notes: this.notesDraft });
    this.viewedJob.notes = this.notesDraft;
    this.cdr.markForCheck();
  }

  getLatestJobUpdate(job: Job): JobUpdate {
    return job.jobUpdates.reduce((latest, current) => {
      return current.updatedAt > latest.updatedAt ? current : latest;
    });
  }

  async updateJobStatus(job: Job, newStatus: JobStatus) {
    await this.jobService.updateJobStatus(job.id!, newStatus);
    this.cdr.markForCheck();
    job.jobUpdates.push({ status: newStatus, updatedAt: new Date() });
  }

  getStatuses() {
    return Object.values(JobStatus);
  }

  async analyseJob() {
    if (!this.viewedJob) return;
    this.aiError = '';
    this.isAnalysing = true;
    this.jobAnalysis = undefined;

    try {
      this.jobAnalysis = await this.aiService.analyseJob(this.viewedJob.jobDescription);
      await this.jobService.saveJobAnalysis(this.viewedJob.id!, this.jobAnalysis);
      this.viewedJob.jobAnalysis = this.jobAnalysis;
    } catch (err) {
      this.aiError = (err as Error).message;
    } finally {
      this.isAnalysing = false;
      this.cdr.markForCheck();
    }
  }

  private async loadCvDocuments() {
    if (!this.viewedJob?.id) return;

    try {
      this.cvDocuments = await this.jobService.getGeneratedDocuments(this.viewedJob.id, 'cv');
      this.activeCv = this.cvDocuments[0];
    } catch (err) {
      this.cvDocuments = [];
      this.activeCv = undefined;
      this.cvError = (err as Error).message;
      console.error('Could not load generated documents:', err);
    } finally {
      this.cdr.markForCheck();
    }
  }

  selectCvVersion(document: GeneratedDocument) {
    this.activeCv = document;
  }

  async generateCv() {
    if (!this.viewedJob?.id || !this.user) return;

    this.cvError = '';
    this.isGeneratingCv = true;

    try {
      const profile = this.careerProfiles.find((p) => p.id === this.selectedProfileId);

      const result = await this.aiService.generateCv({
        info: this.user.info,
        career: this.user.career,
        job: this.viewedJob,
        profile,
        analysis: this.jobAnalysis,
      });

      const validation = validateCv(result.cv, this.user.career);
      const content = renderCvMarkdown(result.cv, this.user.info, this.user.career);

      const saved = await this.jobService.saveGeneratedDocument(this.viewedJob.id, {
        type: 'cv',
        content,
        structured: result.cv,
        validation,
        careerProfileId: profile?.id ?? null,
        evidenceFactIds: result.selection.selectedFactIds,
        jobAnalysis: result.analysis,
        model: result.model,
      });

      await this.jobService.updateJob(this.viewedJob.id, { generatedCv: content });
      this.viewedJob.generatedCv = content;
      this.viewedJob.jobAnalysis = result.analysis;
      this.jobAnalysis = result.analysis;

      this.cvDocuments = [saved, ...this.cvDocuments];
      this.activeCv = saved;
    } catch (err) {
      this.cvError = (err as Error).message;
    } finally {
      this.isGeneratingCv = false;
      this.cdr.markForCheck();
    }
  }

  private async loadCoverLetterDocuments() {
    if (!this.viewedJob?.id) return;

    try {
      this.coverLetterDocuments = await this.jobService.getGeneratedDocuments(
        this.viewedJob.id,
        'coverLetter',
      );
      this.activeCoverLetter = this.coverLetterDocuments[0];
    } catch (err) {
      this.coverLetterDocuments = [];
      this.activeCoverLetter = undefined;
      this.coverLetterError = (err as Error).message;
      console.error('Could not load cover letters:', err);
    } finally {
      this.cdr.markForCheck();
    }
  }

  selectCoverLetterVersion(document: GeneratedDocument) {
    this.activeCoverLetter = document;
  }

  async generateCoverLetter() {
    if (!this.viewedJob?.id || !this.user) return;

    this.coverLetterError = '';
    this.isGeneratingCoverLetter = true;

    try {
      const profile = this.careerProfiles.find((p) => p.id === this.selectedProfileId);

      const result = await this.aiService.generateCoverLetter({
        info: this.user.info,
        career: this.user.career,
        job: this.viewedJob,
        profile,
        analysis: this.jobAnalysis,
        cv: (this.activeCv?.structured as GeneratedCv) ?? undefined,
      });

      const validation = validateCoverLetter(result.letter, this.user.career);
      const content = renderCoverLetterMarkdown(result.letter, this.user.info, this.viewedJob);

      const saved = await this.jobService.saveGeneratedDocument(this.viewedJob.id, {
        type: 'coverLetter',
        content,
        structured: result.letter,
        validation,
        careerProfileId: profile?.id ?? null,
        evidenceFactIds: result.selection.selectedFactIds,
        jobAnalysis: result.analysis,
        model: result.model,
      });

      await this.jobService.updateJob(this.viewedJob.id, { generatedCoverLetter: content });
      this.viewedJob.generatedCoverLetter = content;
      this.jobAnalysis = result.analysis;

      this.coverLetterDocuments = [saved, ...this.coverLetterDocuments];
      this.activeCoverLetter = saved;
    } catch (err) {
      this.coverLetterError = (err as Error).message;
    } finally {
      this.isGeneratingCoverLetter = false;
      this.cdr.markForCheck();
    }
  }

  async downloadPdf(document: GeneratedDocument) {
    if (!this.user || !this.viewedJob || !document.structured) return;

    this.downloadError = '';
    this.isDownloading = true;

    try {
      const isCv = document.type === 'cv';

      const template = isCv
        ? (this.user.templates?.cv ?? DEFAULT_CV_TEMPLATE)
        : (this.user.templates?.coverLetter ?? DEFAULT_COVER_LETTER_TEMPLATE);

      const payload = isCv
        ? buildCvPayload(document.structured as GeneratedCv, this.user.info, this.user.career)
        : buildCoverLetterPayload(
            document.structured as GeneratedCoverLetter,
            this.user.info,
            this.viewedJob,
          );

      const bytes = await this.pdfService.compilePdf(template, payload);

      const label = [
        this.user.info.name,
        isCv ? 'CV' : 'Cover Letter',
        this.viewedJob.company,
        `v${document.version}`,
      ]
        .filter(Boolean)
        .join(' - ');

      this.pdfService.download(bytes, label);
    } catch (err) {
      this.downloadError = (err as Error).message;
    } finally {
      this.isDownloading = false;
      this.cdr.markForCheck();
    }
  }
}
