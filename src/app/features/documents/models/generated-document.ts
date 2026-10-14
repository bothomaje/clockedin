import { CvValidationResult } from './cv-validation';
import { GenerationOptions } from './generation-options';
import { GeneratedCv } from './generated-cv';
import { JobAnalysis } from '../../../domains/jobs/data/models/job-analysis';
import { GeneratedCoverLetter } from './generated-cover-letter';

export type GeneratedDocumentType = 'cv' | 'coverLetter';

export interface GeneratedDocument {
  id?: string;
  type: GeneratedDocumentType;
  version: number;
  content: string;
  structured: GeneratedCv | GeneratedCoverLetter | null;
  validation: CvValidationResult | null;
  careerProfileId: string | null;
  evidenceFactIds: string[];
  jobAnalysis: JobAnalysis | null;
  model: string;
  generatedAt: Date;
  options: GenerationOptions | null;
  editedAt: Date | null;
}

export type NewGeneratedDocument = Omit<
  GeneratedDocument,
  'id' | 'version' | 'generatedAt' | 'editedAt'
>;
