import { APPLICATION_STATUSES, getLatestJobUpdate, Job, JobStatus } from '../data/models/job';

export interface ApplicationStats {
  total: number;
  activeRoles: number;
  interviews: number;
  offers: number;
}

const getApplications = (jobs: Job[]) =>
  jobs.filter((j) => APPLICATION_STATUSES.includes(getLatestJobUpdate(j).status));

export const computeStats = (jobs: Job[]): ApplicationStats => {
  const applications = getApplications(jobs);
  return {
    total: applications.length,
    activeRoles: applications.filter((j) =>
      [JobStatus.APPLIED, JobStatus.INTERVIEW].includes(getLatestJobUpdate(j).status),
    ).length,
    interviews: applications.filter((j) => getLatestJobUpdate(j).status === JobStatus.INTERVIEW)
      .length,
    offers: applications.filter((j) =>
      [JobStatus.OFFER, JobStatus.ACCEPTED].includes(getLatestJobUpdate(j).status),
    ).length,
  };
};

export const computeActiveApplications = (jobs: Job[], limit = 5) =>
  getApplications(jobs)
    .filter((j) =>
      [JobStatus.APPLIED, JobStatus.INTERVIEW, JobStatus.OFFER].includes(
        getLatestJobUpdate(j).status,
      ),
    )
    .sort(
      (a, b) =>
        getLatestJobUpdate(b).updatedAt.getTime() - getLatestJobUpdate(a).updatedAt.getTime(),
    )
    .slice(0, limit);
