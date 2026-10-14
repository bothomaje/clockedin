import { AiJsonSchema } from '../ai-provider';

const str: AiJsonSchema = { type: 'string' };

const list = (items: AiJsonSchema): AiJsonSchema => ({ type: 'array', items });

const obj = (properties: Record<string, AiJsonSchema>, optional: string[] = []): AiJsonSchema => ({
  type: 'object',
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
});

export const jobAnalysisSchema = obj({
  requiredSkills: list(str),
  preferredSkills: list(str),
  responsibilities: list(str),
  technologies: list(str),
  domains: list(str),
  seniority: str,
  keywords: list(str),
});

export const evidenceSelectionSchema = obj({
  selectedFactIds: list(str),
  rationale: str,
});

export const cvSchema = obj({
  summary: str,
  experience: list(
    obj({
      sourceId: str,
      company: str,
      role: str,
      startDate: str,
      endDate: str,
      bullets: list(str),
    }),
  ),
  education: list(
    obj(
      {
        sourceId: str,
        institution: str,
        qualification: str,
        field: str,
        startDate: str,
        endDate: str,
      },
      ['field'],
    ),
  ),
  projects: list(
    obj({
      sourceId: str,
      name: str,
      bullets: list(str),
    }),
  ),
  skills: list(str),
});

export const coverLetterSchema = obj({
  recipient: str,
  salutation: str,
  paragraphs: list(
    obj({
      text: str,
      sourceIds: list(str),
    }),
  ),
  closing: str,
});
