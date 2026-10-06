import { Location, WorkMode } from '../../../shared/location/location.model';
import { Evidence } from './evidence';

export interface Experience {
  id?: string;
  company?: string;
  role?: string;
  location?: Location | null;
  legacyLocation?: string;
  workMode?: WorkMode | null;
  employmentType?: string;
  startDate: Date;
  endDate?: Date | null;
  description?: string;
  evidence?: Evidence[];
  skillIds?: string[];
  domains?: string[];
}
