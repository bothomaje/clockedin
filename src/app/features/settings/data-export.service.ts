import { inject, Service } from '@angular/core';
import { ProfileState } from '../profile/state/profile-state';
import { JobState } from '../jobs/state/job-state';

@Service()
export class DataExportService {
  private profileState = inject(ProfileState);
  private jobState = inject(JobState);

  async download(): Promise<void> {
    await this.profileState.load();
    if (this.jobState.jobs().length === 0) await this.jobState.loadJobs();

    const user = this.profileState.user();
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { info: user.info, career: user.career },
      jobs: this.jobState.jobs(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clockedin-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
