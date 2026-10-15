import { Routes } from '@angular/router';

export const jobsRoutes: Routes = [
  {
    path: '',
    data: {
      seo: {
        title: 'My Jobs | clockedin',
        description: 'Manage saved jobs and job details in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./jobs-list-page/jobs-list-page').then((m) => m.JobsListPage),
  },
  {
    path: 'new',
    data: {
      seo: {
        title: 'Add a Job | clockedin',
        description: 'Add a job to your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./job-form-page/job-form-page').then((m) => m.JobFormPage),
  },
  {
    path: ':id/edit',
    data: {
      seo: {
        title: 'Edit Job | clockedin',
        description: 'Edit a saved job in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./job-form-page/job-form-page').then((m) => m.JobFormPage),
  },
];
