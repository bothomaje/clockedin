import { Link } from './link.model';

export interface Info {
  name?: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  links?: Link[];
}
