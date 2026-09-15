import { CvValidationResult } from './cv-validation.model';
import { GeneratedCv } from './generated-cv.model';
import { JobAnalysis } from '../job-analysis.model';
import { GeneratedCoverLetter } from './generated-cover-letter.model';

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
}

export type NewGeneratedDocument = Omit<GeneratedDocument, 'id' | 'version' | 'generatedAt'>;
