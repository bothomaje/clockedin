import { APPLICATION_STATUSES, getLatestJobUpdate, Job, JobStatus } from '../data/models/job';

export const FOLLOW_UP_AFTER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface FollowUp {
  job: Job;
  urgent: boolean;
  text: string;
}

export const computeFollowUps = (jobs: Job[], limit = 4): FollowUp[] => {
  const cutoff = Date.now() - FOLLOW_UP_AFTER_DAYS * DAY_MS;
  return jobs
    .filter((j) => {
      const latest = getLatestJobUpdate(j);
      return (
        APPLICATION_STATUSES.includes(latest.status) &&
        [JobStatus.APPLIED, JobStatus.INTERVIEW].includes(latest.status) &&
        latest.updatedAt.getTime() < cutoff
      );
    })
    .map((job) => {
      const latest = getLatestJobUpdate(job);
      const days = Math.floor((Date.now() - new Date(latest.updatedAt).getTime()) / DAY_MS);
      const urgent = latest.status === JobStatus.INTERVIEW;
      return {
        job,
        urgent,
        text: urgent
          ? `It's been ${days} days since your last update. Consider following up.`
          : `Applied ${days} days ago. It may be time to follow up.`,
      };
    })
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) ||
        getLatestJobUpdate(a.job).updatedAt.getTime() -
          getLatestJobUpdate(b.job).updatedAt.getTime(),
    )
    .slice(0, limit);
};
