import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const tokenGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(Auth);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    return router.parseUrl('/login');
  }
};
