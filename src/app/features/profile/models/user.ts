import { Career } from './career';
import { DocTemplates } from './doc-templates';
import { Info } from './info';
export interface User {
  id?: string;
  info: Info;
  career: Career;
  templates?: DocTemplates;
  aiConsentAt?: Date | null;
  onboardingComplete?: boolean;
}
