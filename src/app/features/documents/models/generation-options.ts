export type CvTone = 'technical' | 'creative' | 'executive' | 'balanced';
export type CvLength = 'onePage' | 'twoPage' | 'detailed';
export type LetterTone = 'professional' | 'conversational' | 'technical' | 'bold';
export type LetterLength = 'short' | 'standard' | 'detailed';

export interface CvOptions {
  tone: CvTone;
  length: CvLength;
  emphasis: string[];
}

export interface CoverLetterOptions {
  tone: LetterTone;
  length: LetterLength;
  recipient: string;
  emphasis: string[];
}

export type GenerationOptions = CvOptions | CoverLetterOptions;

export const DEFAULT_CV_OPTIONS: CvOptions = { tone: 'balanced', length: 'twoPage', emphasis: [] };

export const DEFAULT_LETTER_OPTIONS: CoverLetterOptions = {
  tone: 'professional',
  length: 'standard',
  recipient: '',
  emphasis: [],
};

export const CV_TONES: { value: CvTone; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'creative', label: 'Creative' },
  { value: 'executive', label: 'Executive' },
  { value: 'balanced', label: 'Balanced' },
];

export const CV_LENGTHS: { value: CvLength; label: string }[] = [
  { value: 'onePage', label: '1-Page CV' },
  { value: 'twoPage', label: '2-Page CV' },
  { value: 'detailed', label: 'Detailed Profile' },
];

export const LETTER_TONES: { value: LetterTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'technical', label: 'Technical' },
  { value: 'bold', label: 'Bold' },
];

export const LETTER_LENGTHS: { value: LetterLength; label: string }[] = [
  { value: 'short', label: 'Short (3 paras)' },
  { value: 'standard', label: 'Standard (3-4)' },
  { value: 'detailed', label: 'Detailed (4-5)' },
];
