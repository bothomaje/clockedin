import { Career } from './career/career.model';
import { DocTemplates } from './doc-templates.model';
import { Info } from './info.model';
export interface User {
  id?: string;
  info: Info;
  career: Career;
  templates?: DocTemplates;
}
