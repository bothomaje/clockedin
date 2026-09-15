import { GeneratedCv } from '../models/ai/generated-cv.model';
import { Career } from '../models/user/career/career.model';
import { Info } from '../models/user/info.model';

export interface SkillGroup {
  category: string;
  items: string[];
}

export function groupSkills(skills: string[], career: Career): SkillGroup[] {
  const categoryOf = new Map<string, string>();

  for (const skill of career.skills ?? []) {
    if (skill.name) categoryOf.set(skill.name.trim().toLowerCase(), skill.category ?? 'Other');
  }

  const grouped = new Map<string, string[]>();

  for (const name of skills ?? []) {
    const category = categoryOf.get(name.trim().toLowerCase()) ?? 'Other';
    grouped.set(category, [...(grouped.get(category) ?? []), name]);
  }

  return [...grouped.entries()].map(([category, items]) => ({ category, items }));
}

export function buildCvPayload(cv: GeneratedCv, info: Info, career: Career) {
  return {
    info: {
      name: info.name ?? '',
      contact: [info.email, info.phone, info.location].filter(Boolean).join(' · '),
      links: (info.links ?? []).map((link) => ({ label: link.type, url: link.url })),
    },
    cv: {
      summary: cv.summary ?? '',
      experience: cv.experience ?? [],
      education: cv.education ?? [],
      projects: cv.projects ?? [],
      skills: groupSkills(cv.skills ?? [], career),
    },
  };
}
