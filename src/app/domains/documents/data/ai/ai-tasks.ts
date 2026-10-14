import { JobAnalysis } from '../../../../domains/jobs/data/models/job-analysis';
import { Job } from '../../../../domains/jobs/data/models/job';
import { Info } from '@domains/profile';
import { Career } from '@domains/profile';
import { CareerProfile } from '@domains/profile';
import { GeneratedCv } from '../models/generated-cv';
import { GeneratedCoverLetter } from '../models/generated-cover-letter';
import { EvidenceSelection } from '../models/evidence-selection';
import { CoverLetterOptions, CvOptions } from '../models/generation-options';
import { GenerationStage } from '../models/generation-stage';
import { AiRequestContext } from './ai-provider';

export interface GenerateCvRequest {
  info: Info;
  career: Career;
  job: Job;
  profile?: CareerProfile;
  analysis?: JobAnalysis;
  options?: CvOptions;
  onProgress?: (stage: GenerationStage) => void;
  context?: AiRequestContext;
}

export interface GenerateCvResult {
  cv: GeneratedCv;
  analysis: JobAnalysis;
  selection: EvidenceSelection;
  model: string;
}

export interface GenerateCoverLetterRequest {
  info: Info;
  career: Career;
  job: Job;
  profile?: CareerProfile;
  analysis?: JobAnalysis;
  cv?: GeneratedCv;
  options?: CoverLetterOptions;
  onProgress?: (stage: GenerationStage) => void;
  context?: AiRequestContext;
}

export interface GenerateCoverLetterResult {
  letter: GeneratedCoverLetter;
  analysis: JobAnalysis;
  selection: EvidenceSelection;
  model: string;
}
