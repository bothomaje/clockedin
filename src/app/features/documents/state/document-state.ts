import { Service, inject, signal } from '@angular/core';
import { DocumentRepository } from '../data/document.repository';
import { JobState } from '../../jobs/state/job-state';
import {
  AiGenerator,
  GenerateCvRequest,
  GenerateCvResult,
  GenerateCoverLetterRequest,
  GenerateCoverLetterResult,
} from '../generation/ai/ai-generator';
import { GeneratedDocument } from '../models/generated-document';
import { validateCv } from '../generation/ai/cv-validator';
import { renderCvMarkdown } from '../generation/ai/cv-renderer';
import { validateCoverLetter } from '../generation/ai/cover-letter-validator';
import { renderCoverLetterMarkdown } from '../generation/ai/cover-letter-renderer';

@Service()
export class DocumentState {
  private documentRepository = inject(DocumentRepository);
  private jobState = inject(JobState);
  private aiGenerator = inject(AiGenerator);

  private cvDocumentsSignal = signal<GeneratedDocument[]>([]);
  private activeCvSignal = signal<GeneratedDocument | undefined>(undefined);
  private cvErrorSignal = signal('');
  private generatingCvSignal = signal(false);

  private coverLetterDocumentsSignal = signal<GeneratedDocument[]>([]);
  private activeCoverLetterSignal = signal<GeneratedDocument | undefined>(undefined);
  private coverLetterErrorSignal = signal('');
  private generatingCoverLetterSignal = signal(false);

  cvDocuments = this.cvDocumentsSignal.asReadonly();
  activeCv = this.activeCvSignal.asReadonly();
  cvError = this.cvErrorSignal.asReadonly();
  isGeneratingCv = this.generatingCvSignal.asReadonly();

  coverLetterDocuments = this.coverLetterDocumentsSignal.asReadonly();
  activeCoverLetter = this.activeCoverLetterSignal.asReadonly();
  coverLetterError = this.coverLetterErrorSignal.asReadonly();
  isGeneratingCoverLetter = this.generatingCoverLetterSignal.asReadonly();

  async loadForJob(jobId: string): Promise<void> {
    this.cvErrorSignal.set('');
    this.coverLetterErrorSignal.set('');

    try {
      const cvDocs = await this.documentRepository.getGeneratedDocuments(jobId, 'cv');
      this.cvDocumentsSignal.set(cvDocs);
      this.activeCvSignal.set(cvDocs[0]);
    } catch (err) {
      this.cvDocumentsSignal.set([]);
      this.activeCvSignal.set(undefined);
      this.cvErrorSignal.set((err as Error).message);
    }

    try {
      const letterDocs = await this.documentRepository.getGeneratedDocuments(jobId, 'coverLetter');
      this.coverLetterDocumentsSignal.set(letterDocs);
      this.activeCoverLetterSignal.set(letterDocs[0]);
    } catch (err) {
      this.coverLetterDocumentsSignal.set([]);
      this.activeCoverLetterSignal.set(undefined);
      this.coverLetterErrorSignal.set((err as Error).message);
    }
  }

  selectCvVersion(document: GeneratedDocument): void {
    this.activeCvSignal.set(document);
  }

  selectCoverLetterVersion(document: GeneratedDocument): void {
    this.activeCoverLetterSignal.set(document);
  }

  async generateCv(request: GenerateCvRequest): Promise<GenerateCvResult> {
    this.cvErrorSignal.set('');
    this.generatingCvSignal.set(true);

    try {
      const result = await this.aiGenerator.generateCv(request);
      const validation = validateCv(result.cv, request.career);
      const content = renderCvMarkdown(result.cv, request.info, request.career);

      const saved = await this.documentRepository.saveGeneratedDocument(request.job.id!, {
        type: 'cv',
        content,
        structured: result.cv,
        validation,
        careerProfileId: request.profile?.id ?? null,
        evidenceFactIds: result.selection.selectedFactIds,
        jobAnalysis: result.analysis,
        model: result.model,
      });

      await this.jobState.updateJob(request.job.id!, { generatedCv: content });

      this.cvDocumentsSignal.update((docs) => [saved, ...docs]);
      this.activeCvSignal.set(saved);

      return result;
    } catch (err) {
      this.cvErrorSignal.set((err as Error).message);
      throw err;
    } finally {
      this.generatingCvSignal.set(false);
    }
  }

  async generateCoverLetter(
    request: GenerateCoverLetterRequest,
  ): Promise<GenerateCoverLetterResult> {
    this.coverLetterErrorSignal.set('');
    this.generatingCoverLetterSignal.set(true);

    try {
      const result = await this.aiGenerator.generateCoverLetter(request);
      const validation = validateCoverLetter(result.letter, request.career);
      const content = renderCoverLetterMarkdown(result.letter, request.info, request.job);

      const saved = await this.documentRepository.saveGeneratedDocument(request.job.id!, {
        type: 'coverLetter',
        content,
        structured: result.letter,
        validation,
        careerProfileId: null,
        evidenceFactIds: result.selection.selectedFactIds,
        jobAnalysis: result.analysis,
        model: result.model,
      });

      await this.jobState.updateJob(request.job.id!, { generatedCoverLetter: content });

      this.coverLetterDocumentsSignal.update((docs) => [saved, ...docs]);
      this.activeCoverLetterSignal.set(saved);

      return result;
    } catch (err) {
      this.coverLetterErrorSignal.set((err as Error).message);
      throw err;
    } finally {
      this.generatingCoverLetterSignal.set(false);
    }
  }
}
