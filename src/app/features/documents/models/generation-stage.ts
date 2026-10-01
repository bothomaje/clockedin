export type GenerationStage = 'analysing' | 'selecting' | 'writing' | 'validating' | 'saving';

export const GENERATION_STAGES: { id: GenerationStage; label: string }[] = [
  { id: 'analysing', label: 'Analysing the job description' },
  { id: 'selecting', label: 'Selecting your strongest evidence' },
  { id: 'writing', label: 'Writing the document' },
  { id: 'validating', label: 'Checking every claim against your profile' },
  { id: 'saving', label: 'Saving this version' },
];
