export type { CareerProfile } from './data/models/career-profile';
export type { Career } from './data/models/career';
export type { Todo } from './data/models/info';
export type { Info } from './data/models/info';
export type { Link } from './data/models/link';
export type { User } from './data/models/user';
export { onboardingGuard } from './feature/onboarding.guard';
export { ProfileFacade } from './data/profile.facade';

export const loadOnboarding = () =>
  import('./feature/onboarding/onboarding').then((m) => m.Onboarding);

export const loadProfile = () =>
  import('./feature/profile-page/profile-page').then((m) => m.Profile);
