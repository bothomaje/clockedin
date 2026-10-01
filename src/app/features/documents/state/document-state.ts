import { Service, inject, signal } from '@angular/core';
import { DocumentRepository } from '../data/document.repository';
import { JobState } from '../../jobs/state/job-state';
import { AiService } from '../generation/ai/ai.service';
import {
  GenerateCvRequest,
  GenerateCvResult,
  GenerateCoverLetterRequest,
  GenerateCoverLetterResult,
} from '../generation/ai/ai-tasks';
import { GeneratedDocument } from '../models/generated-document';
import { validateCv } from '../generation/ai/cv-validator';
import { renderCvMarkdown } from '../generation/ai/cv-renderer';
import { validateCoverLetter } from '../generation/ai/cover-letter-validator';
import { renderCoverLetterMarkdown } from '../generation/ai/cover-letter-renderer';
import { GenerationStage } from '../models/generation-stage';
import { letterMaxWords } from '../generation/ai/generation-prompts';
import { GeneratedCv } from '../models/generated-cv';
import { Info } from '../../profile/models/info';
import { Career } from '../../profile/models/career';
import { GeneratedCoverLetter } from '../models/generated-cover-letter';
import { Job } from '../../jobs/models/job';
import { CoverLetterOptions } from '../models/generation-options';

@Service()
export class DocumentState {
  private documentRepository = inject(DocumentRepository);
  private jobState = inject(JobState);
  private aiService = inject(AiService);

  private cvDocumentsSignal = signal<GeneratedDocument[]>([]);
  private activeCvSignal = signal<GeneratedDocument | undefined>(undefined);
  private cvErrorSignal = signal('');
  private generatingCvSignal = signal(false);
  private cvStageSignal = signal<GenerationStage | undefined>(undefined);

  private coverLetterDocumentsSignal = signal<GeneratedDocument[]>([]);
  private activeCoverLetterSignal = signal<GeneratedDocument | undefined>(undefined);
  private coverLetterErrorSignal = signal('');
  private generatingCoverLetterSignal = signal(false);
  private coverLetterStageSignal = signal<GenerationStage | undefined>(undefined);

  cvDocuments = this.cvDocumentsSignal.asReadonly();
  activeCv = this.activeCvSignal.asReadonly();
  cvError = this.cvErrorSignal.asReadonly();
  isGeneratingCv = this.generatingCvSignal.asReadonly();
  cvStage = this.cvStageSignal.asReadonly();

  coverLetterDocuments = this.coverLetterDocumentsSignal.asReadonly();
  activeCoverLetter = this.activeCoverLetterSignal.asReadonly();
  coverLetterError = this.coverLetterErrorSignal.asReadonly();
  isGeneratingCoverLetter = this.generatingCoverLetterSignal.asReadonly();
  coverLetterStage = this.coverLetterStageSignal.asReadonly();

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
      const result = await this.aiService.generateCv({
        ...request,
        onProgress: (stage) => this.cvStageSignal.set(stage),
      });
      this.cvStageSignal.set('validating');
      const validation = validateCv(result.cv, request.career);
      const content = renderCvMarkdown(result.cv, request.info, request.career);

      this.cvStageSignal.set('saving');
      const saved = await this.documentRepository.saveGeneratedDocument(request.job.id!, {
        type: 'cv',
        content,
        structured: result.cv,
        validation,
        careerProfileId: request.profile?.id ?? null,
        evidenceFactIds: result.selection.selectedFactIds,
        jobAnalysis: result.analysis,
        model: result.model,
        options: request.options ?? null,
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
      this.cvStageSignal.set(undefined);
    }
  }

  async generateCoverLetter(
    request: GenerateCoverLetterRequest,
  ): Promise<GenerateCoverLetterResult> {
    this.coverLetterErrorSignal.set('');
    this.generatingCoverLetterSignal.set(true);

    try {
      const result = await this.aiService.generateCoverLetter({
        ...request,
        onProgress: (stage) => this.coverLetterStageSignal.set(stage),
      });
      this.coverLetterStageSignal.set('validating');
      const validation = validateCoverLetter(
        result.letter,
        request.career,
        letterMaxWords(request.options),
      );
      const content = renderCoverLetterMarkdown(result.letter, request.info, request.job);

      this.coverLetterStageSignal.set('saving');
      const saved = await this.documentRepository.saveGeneratedDocument(request.job.id!, {
        type: 'coverLetter',
        content,
        structured: result.letter,
        validation,
        careerProfileId: null,
        evidenceFactIds: result.selection.selectedFactIds,
        jobAnalysis: result.analysis,
        model: result.model,
        options: request.options ?? null,
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
      this.coverLetterStageSignal.set(undefined);
    }
  }

  async saveCvEdits(
    jobId: string,
    document: GeneratedDocument,
    cv: GeneratedCv,
    info: Info,
    career: Career,
  ): Promise<void> {
    const structured = JSON.parse(JSON.stringify(cv)) as GeneratedCv;

    await this.applyEdit(jobId, document, {
      structured,
      content: renderCvMarkdown(structured, info, career),
      validation: validateCv(structured, career),
    });
  }

  async saveCoverLetterEdits(
    jobId: string,
    document: GeneratedDocument,
    letter: GeneratedCoverLetter,
    info: Info,
    career: Career,
    job: Job,
  ): Promise<void> {
    const structured = JSON.parse(JSON.stringify(letter)) as GeneratedCoverLetter;
    const maxWords = letterMaxWords(document.options as CoverLetterOptions | null);

    await this.applyEdit(jobId, document, {
      structured,
      content: renderCoverLetterMarkdown(structured, info, job),
      validation: validateCoverLetter(structured, career, maxWords),
    });
  }

  private async applyEdit(
    jobId: string,
    document: GeneratedDocument,
    changes: Pick<GeneratedDocument, 'content' | 'structured' | 'validation'>,
  ): Promise<void> {
    const isCv = document.type === 'cv';
    const docs = isCv ? this.cvDocumentsSignal() : this.coverLetterDocumentsSignal();
    const isLatest = docs[0]?.id === document.id;

    const editedAt = await this.documentRepository.updateGeneratedDocument(
      jobId,
      document.id!,
      changes,
    );

    const updated: GeneratedDocument = { ...document, ...changes, editedAt };
    const replace = (list: GeneratedDocument[]) =>
      list.map((d) => (d.id === updated.id ? updated : d));

    if (isCv) {
      this.cvDocumentsSignal.update(replace);
      this.activeCvSignal.set(updated);
    } else {
      this.coverLetterDocumentsSignal.update(replace);
      this.activeCoverLetterSignal.set(updated);
    }

    if (isLatest) {
      await this.jobState.updateJob(
        jobId,
        isCv ? { generatedCv: changes.content } : { generatedCoverLetter: changes.content },
      );
    }
  }
}
