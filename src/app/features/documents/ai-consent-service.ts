import { inject, Service } from '@angular/core';
import { ProfileState } from '../profile/state/profile-state';
import { User } from '../profile/models/user';

@Service()
export class AiConsentService {
  private profileState = inject(ProfileState);

  async ensureConsent(user: User | undefined): Promise<boolean> {
    if (user?.aiConsentAt) return true;

    const accepted = confirm(
      'Generating a CV or cover letter sends your career data and this job description ' +
        'to Google Gemini for processing. Continue?',
    );
    if (!accepted) return false;

    await this.profileState.recordAiConsent();
    if (user) user.aiConsentAt = new Date();
    return true;
  }
}
