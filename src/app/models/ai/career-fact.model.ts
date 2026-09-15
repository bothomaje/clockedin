export type CareerFactKind =
  'experience' | 'experienceEvidence' | 'education' | 'project' | 'projectEvidence' | 'skill';

export interface CareerFact {
  id: string;
  kind: CareerFactKind;
  parentId?: string;
  text: string;
  meta: Record<string, string>;
}
