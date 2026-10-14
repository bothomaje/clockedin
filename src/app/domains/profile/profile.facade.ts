import { inject, Service } from '@angular/core';
import { ProfileState } from './data/state/profile-state';
import { Info } from './data/models/info';

@Service()
export class ProfileFacade {
  private state = inject(ProfileState);

  readonly info = this.state.info;
  readonly experience = this.state.experience;
  readonly skills = this.state.skills;
  readonly careerProfiles = this.state.careerProfiles;
  readonly loading = this.state.loading;
  readonly onboardingComplete = this.state.onboardingComplete;
  readonly user = this.state.user;

  load = () => this.state.load();
  recordAiConsent = () => this.state.recordAiConsent();
  revokeAiConsent = () => this.state.revokeAiConsent();
  createProfile = (uid: string, email: string, name: string) =>
    this.state.createProfile(uid, email, name);
  deleteAllData = () => this.state.deleteAllData();
  saveInfo = (info: Info) => this.state.saveInfo(info);
}
