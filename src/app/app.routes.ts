import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';
import { codeGuard } from './core/guards/code-guard';
import { authenticatedGuard } from './core/guards/authenticated-guard';
import { tokenGuard } from './core/guards/token-guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [tokenGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/pages/home/home').then((c) => c.Home),
      },
      {
        path: 'recipes',
        loadComponent: () =>
          import('./features/dashboard/pages/recipes/recipes').then((c) => c.Recipes),
      },
      {
        path: 'role-requests',
        loadComponent: () =>
          import('./features/dashboard/pages/role-request/role-request').then((c) => c.RoleRequest),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/dashboard/pages/users-list/users-list').then((c) => c.UsersList),
      },
      {
        path: 'user-profile',
        loadComponent: () =>
          import('./features/dashboard/pages/user-profile/user-profile').then((c) => c.UserProfile),
      },
      {
        path: 'all-notifications',
        loadComponent: () =>
          import('./features/dashboard/pages/all-notifications/all-notifications').then((c) => c.AllNotifications),
      }
    ],
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        canActivate: [authenticatedGuard],
        loadComponent: () => import('./features/auth/pages/login/login').then((c) => c.Login),
      },
      {
        path: 'auth-code',
        canActivate: [codeGuard],
        loadComponent: () =>
          import('./features/auth/pages/auth-code/auth-code').then((c) => c.AuthCode),
      },
      /*{
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register').then((c) => c.Register),
      },*/
    ],
  },
];
