import { CvValidationIssue, CvValidationResult } from '../models/ai/cv-validation.model';
import { GeneratedCv } from '../models/ai/generated-cv.model';
import { Career } from '../models/user/career/career.model';
import { allowedSkillTerms, buildCareerFacts, indexFacts } from './career-context';

const NUMBER_PATTERN = /\d[\d.,]*%?/g;

function numbersIn(text: string): string[] {
  return (text.match(NUMBER_PATTERN) ?? []).map((value) => value.replace(/[.,]$/, ''));
}

function equalish(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function validateCv(cv: GeneratedCv, career: Career): CvValidationResult {
  const issues: CvValidationIssue[] = [];
  const facts = buildCareerFacts(career);
  const byId = indexFacts(facts);
  const skillTerms = allowedSkillTerms(career);

  const checkField = (field: string, label: string, claimed: string, actual: string) => {
    if (!equalish(claimed, actual)) {
      issues.push({
        severity: 'error',
        field,
        message: `${label} does not match career data. CV says "${claimed}", career data says "${actual}".`,
      });
    }
  };

  const checkBullets = (field: string, bullets: string[], sourceText: string, parentId: string) => {
    const supported = new Set(
      numbersIn(sourceText).concat(
        facts.filter((fact) => fact.parentId === parentId).flatMap((fact) => numbersIn(fact.text)),
      ),
    );

    bullets.forEach((bullet, index) => {
      for (const value of numbersIn(bullet)) {
        if (!supported.has(value)) {
          issues.push({
            severity: 'warning',
            field: `${field}.bullets[${index}]`,
            message: `Metric "${value}" is not present in the supplied career evidence.`,
          });
        }
      }
    });
  };

  if (!cv.summary?.trim()) {
    issues.push({ severity: 'warning', field: 'summary', message: 'Summary is empty.' });
  }

  if (!cv.experience?.length) {
    issues.push({
      severity: 'error',
      field: 'experience',
      message: 'CV has no experience entries.',
    });
  }

  (cv.experience ?? []).forEach((entry, index) => {
    const field = `experience[${index}]`;
    const fact = byId.get(entry.sourceId);

    if (!fact || fact.kind !== 'experience') {
      issues.push({
        severity: 'error',
        field,
        message: `Unknown experience sourceId "${entry.sourceId}".`,
      });
      return;
    }

    checkField(field, 'Employer', entry.company, fact.meta['company']);
    checkField(field, 'Role', entry.role, fact.meta['role']);
    checkField(field, 'Start date', entry.startDate, fact.meta['startDate']);
    checkField(field, 'End date', entry.endDate, fact.meta['endDate']);
    checkBullets(field, entry.bullets ?? [], fact.text, fact.id);
  });

  (cv.education ?? []).forEach((entry, index) => {
    const field = `education[${index}]`;
    const fact = byId.get(entry.sourceId);

    if (!fact || fact.kind !== 'education') {
      issues.push({
        severity: 'error',
        field,
        message: `Unknown education sourceId "${entry.sourceId}".`,
      });
      return;
    }

    checkField(field, 'Institution', entry.institution, fact.meta['institution']);
    checkField(field, 'Qualification', entry.qualification, fact.meta['qualification']);
  });

  (cv.projects ?? []).forEach((entry, index) => {
    const field = `projects[${index}]`;
    const fact = byId.get(entry.sourceId);

    if (!fact || fact.kind !== 'project') {
      issues.push({
        severity: 'error',
        field,
        message: `Unknown project sourceId "${entry.sourceId}".`,
      });
      return;
    }

    checkField(field, 'Project name', entry.name, fact.meta['name']);
    checkBullets(field, entry.bullets ?? [], fact.text, fact.id);
  });

  (cv.skills ?? []).forEach((item, index) => {
    if (!skillTerms.has(item.trim().toLowerCase())) {
      issues.push({
        severity: 'error',
        field: `skills[${index}]`,
        message: `Skill "${item}" is not in the user's career data.`,
      });
    }
  });

  const seen = new Set<string>();
  for (const entry of cv.experience ?? []) {
    if (seen.has(entry.sourceId)) {
      issues.push({
        severity: 'warning',
        field: 'experience',
        message: `Experience "${entry.sourceId}" appears more than once.`,
      });
    }
    seen.add(entry.sourceId);
  }

  return { ok: !issues.some((issue) => issue.severity === 'error'), issues };
}
