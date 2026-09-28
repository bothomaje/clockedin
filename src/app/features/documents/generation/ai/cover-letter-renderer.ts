import { GeneratedCoverLetter } from '../../models/generated-cover-letter';
import { Job } from '../../../jobs/models/job';
import { Info } from '../../../profile/models/info';

export function renderCoverLetterMarkdown(
  letter: GeneratedCoverLetter,
  info: Info,
  job: Job,
): string {
  const lines: string[] = [];

  lines.push(`**${info.name ?? ''}**`);

  const contact = [info.email, info.phone, info.location].filter(Boolean).join(' · ');
  if (contact) lines.push('', contact);

  lines.push('', '---', '');

  if (letter.recipient) lines.push(letter.recipient);
  if (job.company) lines.push(job.company);

  lines.push('', letter.salutation, '');

  for (const paragraph of letter.paragraphs ?? []) {
    lines.push(paragraph.text, '');
  }

  lines.push(letter.closing, '', info.name ?? '');

  return lines.join('\n').trim();
}

export function buildCoverLetterPayload(letter: GeneratedCoverLetter, info: Info, job: Job) {
  return {
    info: {
      name: info.name ?? '',
      contact: [info.email, info.phone, info.location].filter(Boolean).join(' · '),
    },
    job: {
      company: job.company ?? '',
      role: job.role ?? '',
    },
    letter: {
      recipient: letter.recipient ?? '',
      salutation: letter.salutation ?? '',
      paragraphs: letter.paragraphs ?? [],
      closing: letter.closing ?? '',
    },
  };
}
