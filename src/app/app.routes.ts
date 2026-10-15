import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { onboardingGuard } from '@domains/profile';

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
    loadComponent: () => import('@domains/profile').then((m) => m.loadOnboarding()),
    canActivate: [onboardingGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('@shared/layout/public-layout/public-layout').then((m) => m.PublicLayout),
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
        loadComponent: () => import('@shells/landing').then((m) => m.loadHomePage()),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('@shared/layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    data: {
      seo: {
        title: 'Your Account | clockedin',
        description: 'Sign in or manage access to your clockedin account.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadChildren: () => import('@domains/identity').then((m) => m.authRoutes),
  },
  {
    path: '',
    loadComponent: () => import('@shared/layout/app-shell/app-shell').then((m) => m.AppShell),
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
        loadComponent: () => import('@shells/dashboard').then((m) => m.loadDashboardPage()),
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
        loadComponent: () => import('@domains/profile').then((m) => m.loadProfile()),
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
        loadComponent: () => import('@shells/settings').then((m) => m.loadSettingsPage()),
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
        loadComponent: () => import('@shells/settings').then((m) => m.loadDeleteAccountPage()),
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
        loadChildren: () => import('@domains/recommendations').then((m) => m.exploreRoutes),
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
        loadChildren: () => import('@shells/workspace').then((m) => m.workspaceRoutes),
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
        loadChildren: async () => [
          ...(await import('@domains/jobs')).jobsRoutes,
          ...(await import('@shells/workspace')).jobWorkspaceRoutes,
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
