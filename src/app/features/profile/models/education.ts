export interface Education {
  id?: string;
  institution?: string;
  qualification?: string;
  field?: string;
  startDate?: Date;
  endDate?: Date | null;
  description?: string;
  achievements?: string[];
}
