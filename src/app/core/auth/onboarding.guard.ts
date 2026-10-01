import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap, take } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfileState } from '../../features/profile/state/profile-state';

export const onboardingGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const profileState = inject(ProfileState);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    switchMap((user) => {
      if (!user) return of(router.createUrlTree(['/login']));
      return profileState
        .load()
        .then(() =>
          profileState.onboardingComplete() ? router.createUrlTree(['/dashboard']) : true,
        );
    }),
  );
};
