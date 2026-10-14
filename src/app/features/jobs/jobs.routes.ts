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
  {
    path: ':id',
    data: {
      seo: {
        title: 'Job Details | clockedin',
        description: 'View job details in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./job-spec-page/job-spec-page').then((m) => m.JobSpecPage),
  },
  {
    path: ':id/cv',
    data: {
      seo: {
        title: 'CV Builder | clockedin',
        description: 'Prepare a CV in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
      documentType: 'cv',
      base: 'jobs',
    },
    loadComponent: () =>
      import('../documents/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
  {
    path: ':id/cover-letter',
    data: {
      seo: {
        title: 'Cover Letter Builder | clockedin',
        description: 'Prepare a cover letter in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
      documentType: 'coverLetter',
      base: 'jobs',
    },
    loadComponent: () =>
      import('../documents/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
];
