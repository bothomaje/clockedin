import { Routes } from '@angular/router';

export const jobsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./jobs-list-page/jobs-list-page').then((m) => m.JobsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./job-form-page/job-form-page').then((m) => m.JobFormPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./job-form-page/job-form-page').then((m) => m.JobFormPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./job-spec-page/job-spec-page').then((m) => m.JobSpecPage),
  },
  {
    path: ':id/cv',
    data: { documentType: 'cv', base: 'jobs' },
    loadComponent: () =>
      import('../documents/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
  {
    path: ':id/cover-letter',
    data: { documentType: 'coverLetter', base: 'jobs' },
    loadComponent: () =>
      import('../documents/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
];
