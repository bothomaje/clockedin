export interface Job {
  id?: string;
  company: string;
  role: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  appliedDate: string;
  notes?: string;
}
