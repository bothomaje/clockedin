import {
  CoverLetterOptions,
  CvLength,
  CvOptions,
  CvTone,
  DEFAULT_CV_OPTIONS,
  DEFAULT_LETTER_OPTIONS,
  LetterLength,
  LetterTone,
} from '../../models/generation-options';

const CV_TONE_RULES: Record<CvTone, string> = {
  technical:
    '- Tone: technical. Name tools and techniques precisely, lead bullets with what was built or changed, keep language plain.',
  creative:
    '- Tone: creative. Warmer, more personable phrasing with varied sentence openings, while staying strictly factual.',
  executive:
    '- Tone: executive. Lead with outcomes, scope and ownership. Short sentences, senior register.',
  balanced: '- Tone: balanced. Clear, neutral professional prose.',
};

const CV_LENGTH_RULES: Record<CvLength, string[]> = {
  onePage: [
    '- Target one A4 page. Summary of at most 50 words.',
    '- At most 3 experience entries (keep the most recent and most relevant), 2 or 3 bullets each.',
    '- At most 1 project and at most 8 skills.',
  ],
  twoPage: [
    '- Target up to two A4 pages. Summary of 50 to 80 words.',
    '- 2 to 4 bullets per experience entry.',
  ],
  detailed: [
    '- Detailed dossier. Include every supplied experience and project.',
    '- 3 to 5 bullets per experience entry. Summary of 70 to 120 words.',
  ],
};

const LETTER_TONE_RULES: Record<LetterTone, string> = {
  professional: '- Tone: professional. Measured, courteous, direct.',
  conversational:
    '- Tone: conversational. Natural and personable, contractions allowed, never slangy.',
  technical: '- Tone: technical. Specific about tools, systems and decisions, minimal adjectives.',
  bold: '- Tone: bold. Confident, plain claims backed by the evidence. No hype words.',
};

export const LETTER_LENGTH_SPEC: Record<
  LetterLength,
  { paragraphs: string; words: string; maxWords: number }
> = {
  short: { paragraphs: '3', words: '200 to 250', maxWords: 300 },
  standard: { paragraphs: '3 or 4', words: '250 to 350', maxWords: 400 },
  detailed: { paragraphs: '4 or 5', words: '350 to 450', maxWords: 500 },
};

const EMPHASIS_RULE =
  '- Give extra weight to the themes in <emphasis>, but only where the supplied facts support them. Never add a fact to satisfy an emphasis.';

export function emphasisLines(emphasis: string[] = []): string[] {
  return emphasis.length ? [`<emphasis>${JSON.stringify(emphasis)}</emphasis>`] : [];
}

export function cvOptionRules(options: CvOptions = DEFAULT_CV_OPTIONS): string[] {
  return [
    CV_TONE_RULES[options.tone],
    ...CV_LENGTH_RULES[options.length],
    ...(options.emphasis.length ? [EMPHASIS_RULE] : []),
  ];
}

export function letterOptionRules(options: CoverLetterOptions = DEFAULT_LETTER_OPTIONS): string[] {
  const spec = LETTER_LENGTH_SPEC[options.length];
  return [
    `- ${spec.paragraphs} paragraphs, ${spec.words} words in total.`,
    LETTER_TONE_RULES[options.tone],
    ...(options.emphasis.length ? [EMPHASIS_RULE] : []),
  ];
}

export function letterMaxWords(options?: Pick<CoverLetterOptions, 'length'> | null): number {
  return LETTER_LENGTH_SPEC[options?.length ?? DEFAULT_LETTER_OPTIONS.length].maxWords;
}
