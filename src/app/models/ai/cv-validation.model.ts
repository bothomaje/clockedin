export type CvValidationSeverity = 'error' | 'warning';

export interface CvValidationIssue {
  severity: CvValidationSeverity;
  field: string;
  message: string;
}

export interface CvValidationResult {
  ok: boolean;
  issues: CvValidationIssue[];
}
