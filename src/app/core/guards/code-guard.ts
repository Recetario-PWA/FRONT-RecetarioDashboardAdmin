import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { codeEmail } from '../stores/auth.store';

export const codeGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (codeEmail()) {
    return true;
  } else {
    router.navigateByUrl('/');
    return false;
  }
};
