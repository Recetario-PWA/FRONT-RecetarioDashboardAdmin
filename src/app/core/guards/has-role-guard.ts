import { computed, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { currentUser, userInfoLoading } from '../stores/auth.store';
import { filter, firstValueFrom, interval, timer } from 'rxjs';

export const hasRoleGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);

  await firstValueFrom(
    interval(50).pipe(
      filter(() => !userInfoLoading())
    )
  );

  const user = currentUser();

  if (!user || user.rol?.role !== 'admin') {
   return router.createUrlTree(['/login']);
  }

  return true;
};
