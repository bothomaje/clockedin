import { Routes } from '@angular/router';

export const exploreRoutes: Routes = [
  {
    path: '',
    data: {
      seo: {
        title: 'Explore Opportunities | clockedin',
        description: 'Explore job opportunities in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./explore-page/explore-page').then((m) => m.ExplorePage),
  },
  {
    path: ':id',
    data: {
      seo: {
        title: 'Opportunity Details | clockedin',
        description: 'View opportunity details in your clockedin workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () =>
      import('./explore-detail-page/explore-detail-page').then((m) => m.ExploreDetailPage),
  },
];
