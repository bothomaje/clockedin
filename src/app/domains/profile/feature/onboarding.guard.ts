import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap, take } from 'rxjs';
import { ProfileState } from '../data/state/profile-state';
import { AuthSession } from '@core/auth/auth-session';

export const onboardingGuard: CanActivateFn = () => {
  const session = inject(AuthSession);
  const profile = inject(ProfileState);
  const router = inject(Router);

  return session.currentUser$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) return of(router.createUrlTree(['/login']));
      return profile
        .load()
        .then(() =>
          profile.error() || profile.onboardingComplete()
            ? router.createUrlTree(['/dashboard'])
            : true,
        );
    }),
  );
};
