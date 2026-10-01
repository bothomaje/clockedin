import { inject, Service } from '@angular/core';
import { ProfileState } from '../profile/state/profile-state';
import { User } from '../profile/models/user';
import { AiGenerativeCapability } from './generation/ai/ai-provider';
import { AiService } from './generation/ai/ai.service';

type GenerationKind = 'cv-generation' | 'cover-letter-generation';

@Service()
export class AiConsentService {
  private profileState = inject(ProfileState);
  private ai = inject(AiService);

  async ensureConsent(user: User | undefined, kind: GenerationKind): Promise<boolean> {
    if (user?.aiConsentAt) return true;

    const capabilities: AiGenerativeCapability[] = ['job-analysis', kind];
    const { local, cloud } = await this.ai.describeProcessing(capabilities);

    const accepted = confirm(this.consentMessage(local, cloud));
    if (!accepted) return false;

    await this.profileState.recordAiConsent();
    if (user) user.aiConsentAt = new Date();
    return true;
  }

  private consentMessage(local: boolean, cloud: boolean): string {
    if (local && !cloud) {
      return (
        'Generating a CV or cover letter processes your career data and this job ' +
        'description locally, on this device. Nothing is sent to an AI provider. Continue?'
      );
    }

    if (cloud && !local) {
      return (
        'Generating a CV or cover letter sends your career data and this job description ' +
        'to Google Gemini for processing. Continue?'
      );
    }

    return (
      'Generating a CV or cover letter processes your career data and this job description ' +
      'locally where possible. If local processing is unavailable or insufficient for a step, ' +
      'that step is sent to Google Gemini instead. Continue?'
    );
  }
}
