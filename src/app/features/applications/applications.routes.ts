import { Routes } from '@angular/router';

export const applicationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./applications-list-page/applications-list-page').then((m) => m.ApplicationsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('../jobs/job-form-page/job-form-page').then((m) => m.JobFormPage),
    data: { mode: 'application' },
  },
  {
    path: ':id/edit',
    loadComponent: () => import('../jobs/job-form-page/job-form-page').then((m) => m.JobFormPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./application-detail-page/application-detail-page').then(
        (m) => m.ApplicationDetailPage,
      ),
  },
  {
    path: ':id/cv',
    data: { documentType: 'cv', base: 'applications' },
    loadComponent: () =>
      import('../documents/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
  {
    path: ':id/cover-letter',
    data: { documentType: 'coverLetter', base: 'applications' },
    loadComponent: () =>
      import('../documents/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
];
