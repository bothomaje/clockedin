import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthSession } from './auth-session';

export const guestGuard: CanActivateFn = () => {
  const session = inject(AuthSession);
  const router = inject(Router);

  return session.currentUser$.pipe(
    take(1),
    map((user) => (user ? router.createUrlTree(['/dashboard']) : true)),
  );
};
