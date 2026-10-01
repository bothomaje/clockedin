import { JobAnalysis } from '../../../../jobs/models/job-analysis';
import { DATA_BOUNDARY, FACTUAL_RULES, MAX_JOB_DESCRIPTION_CHARS } from '../prompts/shared';
import { jobAnalysisSchema } from '../schemas/ai-schemas';
import { AiRun } from './ai-task';

export async function analyseJobTask(run: AiRun, jobDescription: string): Promise<JobAnalysis> {
  const description = prepareJobDescription(jobDescription);

  const { data } = await run<JobAnalysis>({
    capability: 'job-analysis',
    schema: jobAnalysisSchema,
    systemInstruction:
      `You analyse job descriptions for a career tracking application. ${FACTUAL_RULES} ${DATA_BOUNDARY} ` +
      'Extract only information stated or clearly implied by the job description.',
    prompt: `<job_description>\n${description}\n</job_description>`,
  });

  return normaliseAnalysis(data);
}

function prepareJobDescription(jobDescription: string): string {
  const trimmed = jobDescription?.trim() ?? '';

  if (!trimmed) {
    throw new Error('Cannot analyse an empty job description.');
  }

  return trimmed.length > MAX_JOB_DESCRIPTION_CHARS
    ? trimmed.slice(0, MAX_JOB_DESCRIPTION_CHARS)
    : trimmed;
}

function normaliseAnalysis(analysis: JobAnalysis): JobAnalysis {
  return {
    requiredSkills: analysis?.requiredSkills ?? [],
    preferredSkills: analysis?.preferredSkills ?? [],
    responsibilities: analysis?.responsibilities ?? [],
    technologies: analysis?.technologies ?? [],
    domains: analysis?.domains ?? [],
    seniority: analysis?.seniority ?? '',
    keywords: analysis?.keywords ?? [],
  };
}
