import { inject } from '@angular/core';
import { AuthService } from './../services/auth-service';
import { CanActivateFn, Router } from '@angular/router';
import { take, map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.currentUser$.pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['./login']))),
  );
};
