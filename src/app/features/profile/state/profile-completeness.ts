import { User } from '../models/user';

export type CompletenessId =
  | 'basics'
  | 'summary'
  | 'links'
  | 'experience'
  | 'evidence'
  | 'education'
  | 'projects'
  | 'skills'
  | 'careerProfiles';

export interface CompletenessItem {
  id: CompletenessId;
  label: string;
  badge: string;
  hint: string;
  action: string;
  done: boolean;
}

export interface Completeness {
  score: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
}

export const READY_SCORE = 80;
const MIN_SKILLS = 3;

export function getCompleteness(user: User): Completeness {
  const { info, career } = user;

  const lacking = [
    ...new Set(
      career.experience
        .filter((e) => !(e.evidence?.length ?? 0) && e.company?.trim())
        .map((e) => e.company!.trim()),
    ),
  ];
  const evidenceHint = lacking.length
    ? `Add detailed metrics & outcomes for your ${lacking.slice(0, 2).join(' & ')}${
        lacking.length > 2 ? ' and other' : ''
      } tenures.`
    : 'Concrete outcomes and metrics the document tools can cite for each role.';

  const items: CompletenessItem[] = [
    {
      id: 'basics',
      label: 'Basic Information',
      badge: 'Missing',
      hint: 'Name and location appear on every generated document.',
      action: 'Add details',
      done: !!info.name?.trim() && !!info.location?.trim(),
    },
    {
      id: 'summary',
      label: 'Executive Summary',
      badge: 'Missing',
      hint: 'A short paragraph on your background and strengths.',
      action: 'Add summary',
      done: !!info.summary?.trim(),
    },
    {
      id: 'links',
      label: 'Portfolio Links',
      badge: 'Incomplete',
      hint: 'GitHub, LinkedIn or a portfolio site.',
      action: 'Add links',
      done: (info.links ?? []).some((l) => l.url.trim()),
    },
    {
      id: 'experience',
      label: 'Experience History',
      badge: 'Missing',
      hint: 'At least one role.',
      action: 'Add experience',
      done: career.experience.length > 0,
    },
    {
      id: 'evidence',
      label: 'Experience History Details',
      badge: 'Missing details',
      hint: evidenceHint,
      action: 'Add evidence',
      done:
        career.experience.length > 0 &&
        career.experience.every((e) => (e.evidence?.length ?? 0) > 0),
    },
    {
      id: 'education',
      label: 'Education',
      badge: 'Missing',
      hint: 'At least one qualification.',
      action: 'Add education',
      done: career.education.length > 0,
    },
    {
      id: 'projects',
      label: 'Projects',
      badge: 'Missing',
      hint: 'Work that shows skills outside your job history.',
      action: 'Add project',
      done: career.projects.length > 0,
    },
    {
      id: 'skills',
      label: 'Skills',
      badge: 'Incomplete',
      hint: `At least ${MIN_SKILLS} skills.`,
      action: 'Add skill',
      done: career.skills.length >= MIN_SKILLS,
    },
    {
      id: 'careerProfiles',
      label: 'Career Profiles',
      badge: 'Missing',
      hint: 'A lens (e.g. Frontend / Web) tells CV generation what to prioritise.',
      action: 'Add career profile',
      done: career.careerProfiles.length > 0,
    },
  ];

  const missing = items.filter((i) => !i.done);
  const score = Math.round(((items.length - missing.length) / items.length) * 100);

  return { score, items, missing };
}
