import { CareerProfile } from './career-profile';
import { Education } from './education';
import { Experience } from './experience';
import { Project } from './project';
import { Skill } from './skill';

export interface Career {
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  careerProfiles: CareerProfile[];
}
