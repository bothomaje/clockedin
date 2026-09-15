import { Career } from './career/career.model';
import { Info } from './info.model';
export interface User {
  id?: string;
  info: Info;
  career: Career;
}
