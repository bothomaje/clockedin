import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingGuard } from './core/auth/onboarding.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding').then((m) => m.Onboarding),
    canActivate: [onboardingGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home-page/home-page').then((m) => m.HomePage),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.Dashboard),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile-page/profile-page').then((m) => m.Profile),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page/settings-page').then((m) => m.Settings),
      },
      {
        path: 'settings/delete',
        loadComponent: () =>
          import('./features/settings/delete-account-page/delete-account-page').then(
            (m) => m.DeleteAccountPage,
          ),
      },
      {
        path: 'applications',
        loadChildren: () =>
          import('./features/applications/applications.routes').then((m) => m.applicationsRoutes),
      },
      {
        path: 'jobs',
        loadChildren: () => import('./features/jobs/jobs.routes').then((m) => m.jobsRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
