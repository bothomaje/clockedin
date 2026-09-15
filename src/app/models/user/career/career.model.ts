import { CareerProfile } from './career-profile.model';
import { Education } from './education.model';
import { Experience } from './experience.model';
import { Project } from './project.model';
import { Skill } from './skill.model';

export interface Career {
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  careerProfiles: CareerProfile[];
}
