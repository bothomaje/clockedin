import { JobAnalysis } from '../../../../jobs/models/job-analysis';
import { Info } from '../../../../profile/models/info';
import { Career } from '../../../../profile/models/career';
import { CareerProfile } from '../../../../profile/models/career-profile';
import { CareerFact } from '../../../models/career-fact';
import { GeneratedCv } from '../../../models/generated-cv';
import { CvOptions } from '../../../models/generation-options';
import { summariseProfile } from '../career-context';
import { cvOptionRules, emphasisLines } from '../generation-prompts';
import { DATA_BOUNDARY, FACTUAL_RULES, publicInfo } from '../prompts/shared';
import { cvSchema } from '../schemas/ai-schemas';
import { AiRun } from './ai-task';

export interface CvTaskInput {
  info: Info;
  career: Career;
  profile?: CareerProfile;
  analysis: JobAnalysis;
  selectedFacts: CareerFact[];
  options?: CvOptions;
}

export async function generateCvTask(
  run: AiRun,
  input: CvTaskInput,
): Promise<{ cv: GeneratedCv; model: string }> {
  const prompt = [
    `<candidate_profile>${JSON.stringify(publicInfo(input.info))}</candidate_profile>`,
    `<career_profile>${JSON.stringify(summariseProfile(input.profile, input.career))}</career_profile>`,
    `<job_analysis>${JSON.stringify(input.analysis)}</job_analysis>`,
    `<selected_facts>${JSON.stringify(input.selectedFacts)}</selected_facts>`,
    ...emphasisLines(input.options?.emphasis),
    '',
    'Write a CV tailored to this role. Rules:',
    '- Every experience, education and project entry must carry the sourceId of the fact it came from.',
    '- Copy company, role, institution, qualification, project name, startDate and endDate verbatim from the fact meta. Keep "Present" as "Present".',
    '- Only use facts with kind "experience", "education" or "project" as entries. Use evidence facts as bullet source material.',
    '- Rewrite bullets in your own words, foregrounding whatever best matches this role. You may draw reasonable, truthful inferences about relevance, but never introduce a metric, tool, employer or achievement absent from the supplied facts.',
    '- The skills array holds plain skill names only, copied exactly from the supplied facts. No categories, no grouping.',
    '- Order experience newest first.',
    ...cvOptionRules(input.options),
  ].join('\n');

  const { data, model } = await run<GeneratedCv>({
    capability: 'cv-generation',
    schema: cvSchema,
    systemInstruction: `You write tailored CVs from verified structured career data. ${FACTUAL_RULES} ${DATA_BOUNDARY}`,
    prompt,
  });

  return { cv: normaliseCv(data), model };
}

function normaliseCv(cv: GeneratedCv): GeneratedCv {
  if (!cv || typeof cv !== 'object') {
    throw new Error('The model returned an unreadable CV. Please try again.');
  }

  return {
    summary: cv.summary ?? '',
    experience: (cv.experience ?? []).map((entry) => ({
      ...entry,
      bullets: entry.bullets ?? [],
    })),
    education: (cv.education ?? []).map((entry) => ({
      ...entry,
      field: entry.field ?? '',
    })),
    projects: (cv.projects ?? []).map((entry) => ({
      ...entry,
      bullets: entry.bullets ?? [],
    })),
    skills: (cv.skills ?? []).filter((name) => !!name),
  };
}
