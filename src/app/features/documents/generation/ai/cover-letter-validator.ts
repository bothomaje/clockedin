import { CvValidationIssue, CvValidationResult } from '../../models/cv-validation';
import { GeneratedCoverLetter } from '../../models/generated-cover-letter';
import { Career } from '../../../profile/models/career';
import { buildCareerFacts, indexFacts } from './career-context';

const NUMBER_PATTERN = /\d[\d.,]*%?/g;
const MAX_WORDS = 400;

const FILLER_PHRASES = [
  'i am writing to express',
  'passion for',
  'perfect fit',
  'dynamic team',
  'proven track record',
  'wealth of experience',
  'hit the ground running',
  'think outside the box',
  'results-driven',
];

function numbersIn(text: string): string[] {
  return (text.match(NUMBER_PATTERN) ?? []).map((value) => value.replace(/[.,]$/, ''));
}

export function validateCoverLetter(
  letter: GeneratedCoverLetter,
  career: Career,
  maxWords = MAX_WORDS,
): CvValidationResult {
  const issues: CvValidationIssue[] = [];
  const facts = buildCareerFacts(career);
  const byId = indexFacts(facts);

  if (!letter.paragraphs?.length) {
    issues.push({ severity: 'error', field: 'paragraphs', message: 'Cover letter has no body.' });
  }

  if (!letter.salutation?.trim()) {
    issues.push({ severity: 'warning', field: 'salutation', message: 'Salutation is empty.' });
  }

  if (!letter.closing?.trim()) {
    issues.push({ severity: 'warning', field: 'closing', message: 'Closing is empty.' });
  }

  const wordCount = (letter.paragraphs ?? [])
    .map((paragraph) => paragraph.text.split(/\s+/).length)
    .reduce((total, count) => total + count, 0);

  if (wordCount > maxWords) {
    issues.push({
      severity: 'warning',
      field: 'paragraphs',
      message: `Cover letter is ${wordCount} words. Aim for under ${maxWords}.`,
    });
  }

  (letter.paragraphs ?? []).forEach((paragraph, index) => {
    const field = `paragraphs[${index}]`;
    const isLast = index === (letter.paragraphs?.length ?? 0) - 1;

    const supportedNumbers = new Set<string>();

    for (const sourceId of paragraph.sourceIds ?? []) {
      const fact = byId.get(sourceId);

      if (!fact) {
        issues.push({
          severity: 'error',
          field,
          message: `Unknown evidence sourceId "${sourceId}".`,
        });
        continue;
      }

      for (const value of numbersIn(fact.text)) supportedNumbers.add(value);
      for (const value of Object.values(fact.meta)) {
        for (const number of numbersIn(value)) supportedNumbers.add(number);
      }
    }

    if (!paragraph.sourceIds?.length && index > 0 && !isLast) {
      issues.push({
        severity: 'warning',
        field,
        message: 'Evidence paragraph cites no career evidence.',
      });
    }

    for (const value of numbersIn(paragraph.text)) {
      if (!supportedNumbers.has(value)) {
        issues.push({
          severity: 'warning',
          field,
          message: `Metric "${value}" is not present in the cited career evidence.`,
        });
      }
    }

    const lowered = paragraph.text.toLowerCase();

    for (const phrase of FILLER_PHRASES) {
      if (lowered.includes(phrase)) {
        issues.push({
          severity: 'warning',
          field,
          message: `Generic application phrasing: "${phrase}".`,
        });
      }
    }
  });

  return { ok: !issues.some((issue) => issue.severity === 'error'), issues };
}
