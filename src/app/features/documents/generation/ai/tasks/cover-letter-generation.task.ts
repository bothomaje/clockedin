import { Job, jobLocationLabel } from '../../../../jobs/models/job';
import { JobAnalysis } from '../../../../jobs/models/job-analysis';
import { Info } from '../../../../profile/models/info';
import { Career } from '../../../../profile/models/career';
import { CareerProfile } from '../../../../profile/models/career-profile';
import { CareerFact } from '../../../models/career-fact';
import { GeneratedCoverLetter } from '../../../models/generated-cover-letter';
import { GeneratedCv } from '../../../models/generated-cv';
import { CoverLetterOptions } from '../../../models/generation-options';
import { summariseProfile } from '../career-context';
import { emphasisLines, letterOptionRules } from '../generation-prompts';
import { DATA_BOUNDARY, FACTUAL_RULES, publicInfo } from '../prompts/shared';
import { coverLetterSchema } from '../schemas/ai-schemas';
import { AiRun } from './ai-task';
import { compareLocations } from '../../../../../shared/location/location-match';

export interface CoverLetterTaskInput {
  info: Info;
  career: Career;
  job: Job;
  profile?: CareerProfile;
  analysis: JobAnalysis;
  selectedFacts: CareerFact[];
  cv?: GeneratedCv;
  options?: CoverLetterOptions;
}

export async function generateCoverLetterTask(
  run: AiRun,
  input: CoverLetterTaskInput,
): Promise<{ letter: GeneratedCoverLetter; model: string }> {
  const prompt = [
    `<candidate_profile>${JSON.stringify(publicInfo(input.info))}</candidate_profile>`,
    `<career_profile>${JSON.stringify(summariseProfile(input.profile, input.career))}</career_profile>`,
    `<job_analysis>${JSON.stringify(input.analysis)}</job_analysis>`,
    `<job_target>${JSON.stringify({
      company: input.job.company ?? '',
      role: input.job.role ?? '',
      location: jobLocationLabel(input.job),
      workMode: input.job.workMode ?? '',
      locationMatch: compareLocations(input.info.location, input.job.location, input.job.workMode),
      recipientName: input.options?.recipient.trim().slice(0, 80) ?? '',
    })}</job_target>`,
    `<selected_facts>${JSON.stringify(input.selectedFacts)}</selected_facts>`,
    ...emphasisLines(input.options?.emphasis),
    input.cv ? `<generated_cv>${JSON.stringify(input.cv)}</generated_cv>` : '',
    '',
    'Write a cover letter for this role. Rules:',
    ...letterOptionRules(input.options),
    '- Paragraph 1 states the role applied for and why. Use the candidate summary only.',
    '- Middle paragraphs give specific evidence. Each must list the sourceIds it draws on.',
    '- The final paragraph closes. It may have an empty sourceIds array.',
    '- Never restate the whole CV. Choose the two or three strongest points.',
    '- Never state a metric, employer, tool, qualification or achievement absent from the supplied facts.',
    '- Write fresh sentences. Do not reuse CV bullet phrasing verbatim even when covering the same evidence — synthesise it into prose, the way a talent specialist would make the case for this candidate to this employer.',
    '- Avoid application filler such as "I am writing to express", "passion for", "perfect fit", "dynamic team", "proven track record".',
    '- recipient is job_target.recipientName when it is not empty, otherwise "Hiring Manager". The salutation addresses the same person or team.',
    '- salutation is the greeting line only. closing is the sign-off line only. Do not include the candidate name in closing.',
    input.cv ? '- Do not contradict anything in the supplied generated CV.' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const { data, model } = await run<GeneratedCoverLetter>({
    capability: 'cover-letter-generation',
    schema: coverLetterSchema,
    systemInstruction: `You write cover letters from verified structured career data. ${FACTUAL_RULES} ${DATA_BOUNDARY}`,
    prompt,
  });

  return { letter: normaliseCoverLetter(data), model };
}

function normaliseCoverLetter(letter: GeneratedCoverLetter): GeneratedCoverLetter {
  if (!letter || typeof letter !== 'object') {
    throw new Error('The model returned an unreadable cover letter. Please try again.');
  }

  return {
    recipient: letter.recipient ?? 'Hiring Manager',
    salutation: letter.salutation ?? 'Dear Hiring Manager,',
    paragraphs: (letter.paragraphs ?? [])
      .filter((paragraph) => !!paragraph?.text?.trim())
      .map((paragraph) => ({
        text: paragraph.text.trim(),
        sourceIds: paragraph.sourceIds ?? [],
      })),
    closing: letter.closing ?? 'Kind regards,',
  };
}
