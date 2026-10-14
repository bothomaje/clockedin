import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { onboardingGuard } from './domains/profile/feature/onboarding.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    data: {
      seo: {
        title: 'Complete Your Setup | clockedin',
        description: 'Finish setting up your clockedin profile.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () =>
      import('./domains/profile/feature/onboarding/onboarding').then((m) => m.Onboarding),
    canActivate: [onboardingGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        data: {
          seo: {
            title: 'clockedin | AI-Powered Job Application and Career Tracker',
            description:
              'Organise your job search with clockedin. Track applications and interviews, explore opportunities and prepare career documents.',
            robots: 'index, follow',
            image: '/clockedin-preview-transparent.png',
          },
        },
        loadComponent: () =>
          import('./domains/landing/feature/home-page/home-page').then((m) => m.HomePage),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    data: {
      seo: {
        title: 'Your Account | clockedin',
        description: 'Sign in or manage access to your clockedin account.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadChildren: () =>
      import('./domains/identity/feature/identity.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/app-shell/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    data: {
      seo: {
        title: 'clockedin | Workspace',
        description: 'Your private clockedin job search workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    children: [
      {
        path: 'dashboard',
        data: {
          seo: {
            title: 'Dashboard | clockedin',
            description: 'Your personal job search dashboard.',
            robots: 'noindex, nofollow',
            canonical: false,
          },
        },
        loadComponent: () =>
          import('./domains/dashboard/feature/dashboard-page/dashboard-page').then(
            (m) => m.Dashboard,
          ),
      },
      {
        path: 'profile',
        data: {
          seo: {
            title: 'Career Profile | clockedin',
            description: 'Manage your career profile in clockedin.',
            robots: 'noindex, nofollow',
            canonical: false,
          },
        },
        loadComponent: () =>
          import('./domains/profile/feature/profile-page/profile-page').then((m) => m.Profile),
      },
      {
        path: 'settings',
        data: {
          seo: {
            title: 'Settings | clockedin',
            description: 'Manage your clockedin account settings.',
            robots: 'noindex, nofollow',
            canonical: false,
          },
        },
        loadComponent: () =>
          import('./features/settings/settings-page/settings-page').then((m) => m.Settings),
      },
      {
        path: 'settings/delete',
        data: {
          seo: {
            title: 'Delete Account | clockedin',
            description: 'Manage deletion of your clockedin account.',
            robots: 'noindex, nofollow',
            canonical: false,
          },
        },
        loadComponent: () =>
          import('./features/settings/delete-account-page/delete-account-page').then(
            (m) => m.DeleteAccountPage,
          ),
      },
      {
        path: 'explore',
        data: {
          seo: {
            title: 'Explore Opportunities | clockedin',
            description: 'Explore job opportunities in your clockedin workspace.',
            robots: 'noindex, nofollow',
            canonical: false,
          },
        },
        loadChildren: () =>
          import('./domains/recommendations/feature/explore.routes').then((m) => m.exploreRoutes),
      },
      {
        path: 'applications',
        data: {
          seo: {
            title: 'My Applications | clockedin',
            description: 'Track your job applications in clockedin.',
            robots: 'noindex, nofollow',
            canonical: false,
          },
        },
        loadChildren: () =>
          import('./domains/applications/feature/applications.routes').then(
            (m) => m.applicationsRoutes,
          ),
      },
      {
        path: 'jobs',
        data: {
          seo: {
            title: 'My Jobs | clockedin',
            description: 'Manage saved jobs and job details in your clockedin workspace.',
            robots: 'noindex, nofollow',
            canonical: false,
          },
        },
        loadChildren: () => import('./features/jobs/jobs.routes').then((m) => m.jobsRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
