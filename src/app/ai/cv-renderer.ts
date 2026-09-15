import { GeneratedCv } from '../models/ai/generated-cv.model';
import { Career } from '../models/user/career/career.model';
import { Info } from '../models/user/info.model';
import { groupSkills } from './cv-payload';

export function renderCvMarkdown(cv: GeneratedCv, info: Info, career: Career): string {
  const lines: string[] = [];

  lines.push(`# ${info.name ?? 'Curriculum Vitae'}`);

  const contact = [info.email, info.phone, info.location].filter(Boolean).join(' · ');
  if (contact) lines.push('', contact);

  const links = (info.links ?? []).map((link) => `[${link.type}](${link.url})`).join(' · ');
  if (links) lines.push('', links);

  if (cv.summary?.trim()) {
    lines.push('', '## Summary', '', cv.summary.trim());
  }

  if (cv.experience?.length) {
    lines.push('', '## Experience');
    for (const entry of cv.experience) {
      lines.push('', `### ${entry.role} — ${entry.company}`);
      lines.push(`*${entry.startDate} – ${entry.endDate}*`, '');
      for (const bullet of entry.bullets ?? []) lines.push(`- ${bullet}`);
    }
  }

  if (cv.projects?.length) {
    lines.push('', '## Projects');
    for (const entry of cv.projects) {
      lines.push('', `### ${entry.name}`, '');
      for (const bullet of entry.bullets ?? []) lines.push(`- ${bullet}`);
    }
  }

  if (cv.education?.length) {
    lines.push('', '## Education');
    for (const entry of cv.education) {
      const field = entry.field ? `, ${entry.field}` : '';
      lines.push('', `### ${entry.qualification}${field}`);
      lines.push(`${entry.institution} · *${entry.startDate} – ${entry.endDate}*`);
    }
  }

  if (cv.skills?.length) {
    lines.push('', '## Skills', '');

    for (const group of groupSkills(cv.skills, career)) {
      lines.push(`**${group.category}:** ${group.items.join(', ')}`);
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}
