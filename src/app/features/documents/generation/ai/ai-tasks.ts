import { JobAnalysis } from '../../../jobs/models/job-analysis';
import { Job } from '../../../jobs/models/job';
import { Info } from '../../../profile/models/info';
import { Career } from '../../../profile/models/career';
import { CareerProfile } from '../../../profile/models/career-profile';
import { GeneratedCv } from '../../models/generated-cv';
import { GeneratedCoverLetter } from '../../models/generated-cover-letter';
import { EvidenceSelection } from '../../models/evidence-selection';
import { CoverLetterOptions, CvOptions } from '../../models/generation-options';
import { GenerationStage } from '../../models/generation-stage';
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
