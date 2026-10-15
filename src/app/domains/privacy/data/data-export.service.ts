import { inject, Service } from '@angular/core';
import { ProfileFacade } from '@domains/profile';
import { JobsFacade } from '@domains/jobs';

@Service()
export class DataExportService {
  private profile = inject(ProfileFacade);
  private jobs = inject(JobsFacade);

  async download(): Promise<void> {
    await this.profile.ensureLoaded();
    if (this.jobs.jobs().length === 0) await this.jobs.ensureLoaded();

    const user = this.profile.user();
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { info: user.info, career: user.career },
      jobs: this.jobs.jobs(),
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
