export type { JobAnalysis } from './data/models/job-analysis';
export type { Job } from './data/models/job';
export {
  jobLocationLabel,
  getLatestJobUpdate,
  JobStatus,
  APPLICATION_STATUSES,
  getSavedAt,
} from './data/models/job';
export { JobDetail } from './ui/job-detail/job-detail';
export type { StatusChangeEvent } from './ui/job-detail/job-detail';
export { JobsFacade } from './data/jobs.facade';
export { JobList } from './feature/job-list/job-list';
export { JobLocationPipe } from './util/job-location.pipe';
export { JobStatusChip } from './ui/job-status-chip/job-status-chip';
export { jobsRoutes } from './feature/jobs.routes';

export const loadJobFormPage = () =>
  import('./feature/job-form-page/job-form-page').then((m) => m.JobFormPage);
