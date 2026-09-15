import { Evidence } from './evidence.model';
import { Skill } from './skill.model';

export interface Experience {
  id?: string;
  company?: string;
  role?: string;
  location?: string;
  employmentType?: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string;
  evidence?: Evidence[];
  skillIds?: string[];
  domains?: string[];
}
