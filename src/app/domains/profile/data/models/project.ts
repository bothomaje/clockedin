import { Evidence } from './evidence';
import { Link } from './link';

export interface Project {
  id?: string;
  name?: string;
  description?: string;
  technologies?: string[];
  links?: Link[];
  evidence?: Evidence[];
  skillIds?: string[];
  domains?: string[];
}
