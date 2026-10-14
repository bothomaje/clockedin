import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap, take } from 'rxjs';
import { ProfileState } from '../../features/profile/state/profile-state';
import { AuthSession } from './auth-session';

export const onboardingGuard: CanActivateFn = () => {
  const session = inject(AuthSession);
  const profileState = inject(ProfileState);
  const router = inject(Router);

  return session.currentUser$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) return of(router.createUrlTree(['/login']));
      return profileState
        .load()
        .then(() =>
          profileState.error() || profileState.onboardingComplete()
            ? router.createUrlTree(['/dashboard'])
            : true,
        );
    }),
  );
};
