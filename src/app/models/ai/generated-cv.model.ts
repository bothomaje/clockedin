export interface GeneratedCvExperience {
  sourceId: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface GeneratedCvEducation {
  sourceId: string;
  institution: string;
  qualification: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface GeneratedCvProject {
  sourceId: string;
  name: string;
  bullets: string[];
}

export interface GeneratedCv {
  summary: string;
  experience: GeneratedCvExperience[];
  education: GeneratedCvEducation[];
  projects: GeneratedCvProject[];
  skills: string[];
}
