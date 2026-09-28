import { Link } from './link';

export interface Info {
  name?: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  links?: Link[];
}
