import { CareerFact } from '../../models/career-fact';
import { Career } from '../../../profile/models/career';
import { CareerProfile } from '../../../profile/models/career-profile';

function yearMonth(value?: Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value as unknown as string);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function buildCareerFacts(career: Career): CareerFact[] {
  const facts: CareerFact[] = [];
  const skillNames = new Map<string, string>();

  for (const skill of career.skills ?? []) {
    if (skill.id && skill.name) skillNames.set(skill.id, skill.name);
  }

  const resolveSkills = (ids?: string[]): string =>
    (ids ?? [])
      .map((id) => skillNames.get(id))
      .filter((name): name is string => !!name)
      .join(', ');

  (career.experience ?? []).forEach((experience, index) => {
    const id = `exp:${experience.id ?? index}`;
    facts.push({
      id,
      kind: 'experience',
      text: experience.description ?? '',
      meta: {
        company: experience.company ?? '',
        role: experience.role ?? '',
        location: experience.location ?? '',
        employmentType: experience.employmentType ?? '',
        startDate: yearMonth(experience.startDate),
        endDate: yearMonth(experience.endDate) || 'Present',
        skills: resolveSkills(experience.skillIds),
        domains: (experience.domains ?? []).join(', '),
      },
    });

    (experience.evidence ?? []).forEach((evidence, evidenceIndex) => {
      facts.push({
        id: `${id}:ev:${evidence.id ?? evidenceIndex}`,
        kind: 'experienceEvidence',
        parentId: id,
        text: evidence.text ?? '',
        meta: { skills: resolveSkills(evidence.skillIds) },
      });
    });
  });

  (career.education ?? []).forEach((education, index) => {
    facts.push({
      id: `edu:${education.id ?? index}`,
      kind: 'education',
      text: [education.description ?? '', ...(education.achievements ?? [])]
        .filter(Boolean)
        .join(' '),
      meta: {
        institution: education.institution ?? '',
        qualification: education.qualification ?? '',
        field: education.field ?? '',
        startDate: yearMonth(education.startDate),
        endDate: yearMonth(education.endDate) || 'Present',
      },
    });
  });

  (career.projects ?? []).forEach((project, index) => {
    const id = `proj:${project.id ?? index}`;
    facts.push({
      id,
      kind: 'project',
      text: project.description ?? '',
      meta: {
        name: project.name ?? '',
        technologies: (project.technologies ?? []).join(', '),
        skills: resolveSkills(project.skillIds),
        domains: (project.domains ?? []).join(', '),
      },
    });

    (project.evidence ?? []).forEach((evidence, evidenceIndex) => {
      facts.push({
        id: `${id}:ev:${evidence.id ?? evidenceIndex}`,
        kind: 'projectEvidence',
        parentId: id,
        text: evidence.text ?? '',
        meta: { skills: resolveSkills(evidence.skillIds) },
      });
    });
  });

  (career.skills ?? []).forEach((skill, index) => {
    facts.push({
      id: `skill:${skill.id ?? index}`,
      kind: 'skill',
      text: skill.name ?? '',
      meta: { name: skill.name ?? '', category: skill.category ?? 'Other' },
    });
  });

  return facts;
}

export function indexFacts(facts: CareerFact[]): Map<string, CareerFact> {
  return new Map(facts.map((fact) => [fact.id, fact]));
}

/** Every skill term the CV is allowed to name. */
export function allowedSkillTerms(career: Career): Set<string> {
  const terms = new Set<string>();
  for (const skill of career.skills ?? []) {
    if (skill.name) terms.add(skill.name.trim().toLowerCase());
  }
  for (const project of career.projects ?? []) {
    for (const technology of project.technologies ?? []) {
      if (technology) terms.add(technology.trim().toLowerCase());
    }
  }
  return terms;
}

export function summariseProfile(profile?: CareerProfile, career?: Career) {
  if (!profile) return null;
  const skillNames = new Map<string, string>();
  for (const skill of career?.skills ?? []) {
    if (skill.id && skill.name) skillNames.set(skill.id, skill.name);
  }
  return {
    name: profile.name ?? '',
    description: profile.description ?? '',
    domains: profile.domains ?? [],
    skills: (profile.skillIds ?? [])
      .map((id) => skillNames.get(id))
      .filter((name): name is string => !!name),
  };
}
