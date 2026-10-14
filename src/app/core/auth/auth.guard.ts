import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { take, map } from 'rxjs';
import { AuthSession } from './auth-session';

export const authGuard: CanActivateFn = () => {
  const session = inject(AuthSession);
  const router = inject(Router);
  return session.currentUser$.pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};
