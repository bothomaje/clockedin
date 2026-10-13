import { Routes } from '@angular/router';

export const exploreRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./explore-page/explore-page').then((m) => m.ExplorePage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./explore-detail-page/explore-detail-page').then((m) => m.ExploreDetailPage),
  },
];
