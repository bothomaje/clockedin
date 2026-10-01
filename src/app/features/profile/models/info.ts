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
  location?: string;
  summary?: string;
  links?: Link[];
  targetRoles?: string;
  targetSalary?: string;
  todos?: Todo[];
}
