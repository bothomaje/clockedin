import { GeneratedCv } from '../../models/generated-cv';
import { Career } from '../../../profile/models/career';
import { Info } from '../../../profile/models/info';
import { Link } from '../../../profile/models/link';
import { workLocationLabel } from '../../../../shared/location/location.model';

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

function isoDate(d?: Date | null): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function handleFromUrl(url?: string): string {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^(github\.com|linkedin\.com\/in)\//i, '')
    .replace(/\/+$/, '');
}

function findLink(links: Link[] | undefined, match: RegExp): Link | undefined {
  return (links ?? []).find((l) => match.test(l.type ?? ''));
}

export function buildCvPayload(cv: GeneratedCv, info: Info, career: Career) {
  const expById = new Map((career.experience ?? []).map((e, i) => [`exp:${e.id ?? i}`, e]));
  const eduById = new Map((career.education ?? []).map((e, i) => [`edu:${e.id ?? i}`, e]));
  const projById = new Map((career.projects ?? []).map((p, i) => [`proj:${p.id ?? i}`, p]));

  const github = findLink(info.links, /github/i);
  const linkedin = findLink(info.links, /linkedin/i);
  const site = findLink(info.links, /site|portfolio|website|personal/i);

  return {
    info: {
      name: info.name ?? '',
      phone: info.phone ?? '',
      email: info.email ?? '',
      githubUsername: handleFromUrl(github?.url),
      linkedinUserId: handleFromUrl(linkedin?.url),
      personalSite: handleFromUrl(site?.url),
    },
    cv: {
      summary: cv.summary ?? '',
      experience: (cv.experience ?? []).map((entry) => {
        const source = expById.get(entry.sourceId);
        return {
          role: entry.role,
          company: entry.company,
          location: source ? workLocationLabel(source) : '',
          startDate: isoDate(source?.startDate),
          endDate: isoDate(source?.endDate),
          bullets: entry.bullets ?? [],
        };
      }),
      education: (cv.education ?? []).map((entry) => {
        const source = eduById.get(entry.sourceId);
        return {
          institution: entry.institution,
          location: '',
          qualification: entry.qualification,
          field: entry.field,
          startDate: isoDate(source?.startDate),
          endDate: isoDate(source?.endDate),
        };
      }),
      projects: (cv.projects ?? []).map((entry) => {
        const source = projById.get(entry.sourceId);
        return {
          name: entry.name,
          stack: (source?.technologies ?? []).join(', '),
          url: source?.links?.[0]?.url ?? '',
          bullets: entry.bullets ?? [],
        };
      }),
      skills: groupSkills(cv.skills ?? [], career),
    },
  };
}
