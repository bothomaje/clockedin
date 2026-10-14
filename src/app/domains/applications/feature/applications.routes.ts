import { Routes } from '@angular/router';

export const applicationsRoutes: Routes = [
  {
    path: '',
    data: {
      seo: {
        title: 'My Applications | clockedin',
        description: 'Track your job applications in clockedin.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () =>
      import('./applications-list-page/applications-list-page').then((m) => m.ApplicationsListPage),
  },
  {
    path: 'new',
    data: {
      seo: {
        title: 'Add an Application | clockedin',
        description: 'Create a job application record in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
      mode: 'application',
    },
    loadComponent: () =>
      import('../../jobs/feature/job-form-page/job-form-page').then((m) => m.JobFormPage),
  },
  {
    path: ':id/edit',
    data: {
      seo: {
        title: 'Edit Application | clockedin',
        description: 'Edit a job application in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () =>
      import('../../jobs/feature/job-form-page/job-form-page').then((m) => m.JobFormPage),
  },
  {
    path: ':id',
    data: {
      seo: {
        title: 'Application Details | clockedin',
        description: 'View a job application in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () =>
      import('./application-detail-page/application-detail-page').then(
        (m) => m.ApplicationDetailPage,
      ),
  },
  {
    path: ':id/cv',
    data: {
      seo: {
        title: 'CV Builder | clockedin',
        description: 'Prepare a CV for an application in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
      documentType: 'cv',
      base: 'applications',
    },
    loadComponent: () =>
      import('../../documents/feature/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
  {
    path: ':id/cover-letter',
    data: {
      seo: {
        title: 'Cover Letter Builder | clockedin',
        description: 'Prepare a cover letter for an application in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
      documentType: 'coverLetter',
      base: 'applications',
    },
    loadComponent: () =>
      import('../../documents/feature/document-wizard-page/document-wizard-page').then(
        (m) => m.DocumentWizardPage,
      ),
  },
];
