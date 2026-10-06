import { Location } from '../../../shared/location/location.model';
import { Link } from './link';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface Info {
  name?: string;
  title?: string;
  email: string;
  phone?: string;
  location?: Location | null;
  legacyLocation?: string;
  summary?: string;
  links?: Link[];
  targetRoles?: string;
  targetSalary?: string;
  todos?: Todo[];
}
