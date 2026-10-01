import { inject, Service } from '@angular/core';
import { Info } from '../../../../profile/models/info';
import { AiProviderId } from '../ai-provider';
import { AiLabRunResult, AiLabService } from '../ai-lab.service';
import { CAREER_FIXTURES, CareerFixtureName } from './fixtures/careers.fixtures';
import { JOB_FIXTURES, JobFixtureName } from './fixtures/jobs.fixtures';

/** Fake candidate identity — these runs never touch real user data. */
const EVAL_INFO: Info = {
  name: 'Eval Candidate',
  email: 'eval@example.invalid',
  location: 'Johannesburg, South Africa',
  summary: 'Fixture profile used only for AI provider evaluation runs.',
};

export interface AiEvalCase {
  name: string;
  career: CareerFixtureName;
  job: JobFixtureName;
}

export interface AiEvalReportEntry {
  case: string;
  kind: 'cv-generation' | 'cover-letter-generation';
  results: AiLabRunResult[];
}

@Service()
export class AiEvalRunner {
  private lab = inject(AiLabService);

  /** Roadmap's minimum CV test set: five roles, one per named category. */
  readonly cvCases: AiEvalCase[] = [
    { name: 'junior-software-engineer', career: 'rich', job: 'juniorSoftwareEngineer' },
    { name: 'frontend-engineer', career: 'rich', job: 'frontendEngineer' },
    { name: 'ux-engineer', career: 'rich', job: 'uxEngineer' },
    { name: 'creative-technology-role', career: 'rich', job: 'creativeTechnology' },
    { name: 'unrelated-role', career: 'rich', job: 'unrelatedRole' },
  ];

  /** Roadmap's minimum cover-letter test set. */
  readonly coverLetterCases: AiEvalCase[] = [
    { name: 'technical-role', career: 'rich', job: 'frontendEngineer' },
    { name: 'creative-role', career: 'rich', job: 'creativeTechnology' },
    { name: 'limited-candidate-overlap', career: 'rich', job: 'unrelatedRole' },
    { name: 'strong-candidate-overlap', career: 'rich', job: 'manyMatchingTechnologies' },
  ];

  /**
   * Roadmap's edge cases. 'multiple-career-profiles' and 'no-career-profile'
   * both use the 'frontendEngineer' job so the only variable is the career
   * shape — richCareer carries two career profiles, noProfile carries none.
   */
  readonly edgeCases: AiEvalCase[] = [
    { name: 'sparse-cv', career: 'sparse', job: 'frontendEngineer' },
    { name: 'long-cv', career: 'rich', job: 'frontendEngineer' },
    { name: 'long-job-description', career: 'rich', job: 'longJobDescription' },
    { name: 'no-matching-technologies', career: 'rich', job: 'unrelatedRole' },
    { name: 'many-matching-technologies', career: 'rich', job: 'manyMatchingTechnologies' },
    { name: 'missing-optional-fields', career: 'missingOptionalFields', job: 'frontendEngineer' },
    { name: 'no-career-profile', career: 'noProfile', job: 'frontendEngineer' },
    { name: 'multiple-career-profiles', career: 'rich', job: 'frontendEngineer' },
  ];

  async runCvSuite(cases: AiEvalCase[], providerIds: AiProviderId[]): Promise<AiEvalReportEntry[]> {
    const entries: AiEvalReportEntry[] = [];

    for (const testCase of cases) {
      const results = await this.lab.compareCvGeneration(
        {
          info: EVAL_INFO,
          career: CAREER_FIXTURES[testCase.career],
          job: JOB_FIXTURES[testCase.job],
        },
        providerIds,
      );
      entries.push({ case: testCase.name, kind: 'cv-generation', results });
    }

    return entries;
  }

  async runCoverLetterSuite(
    cases: AiEvalCase[],
    providerIds: AiProviderId[],
  ): Promise<AiEvalReportEntry[]> {
    const entries: AiEvalReportEntry[] = [];

    for (const testCase of cases) {
      const results = await this.lab.compareCoverLetterGeneration(
        {
          info: EVAL_INFO,
          career: CAREER_FIXTURES[testCase.career],
          job: JOB_FIXTURES[testCase.job],
        },
        providerIds,
      );
      entries.push({ case: testCase.name, kind: 'cover-letter-generation', results });
    }

    return entries;
  }
}
