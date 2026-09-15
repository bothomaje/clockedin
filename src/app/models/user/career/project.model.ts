import { Evidence } from './evidence.model';
import { Link } from '../link.model';
import { Skill } from './skill.model';

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
