export const loadDashboardPage = () =>
  import('./feature/dashboard-page/dashboard-page').then((m) => m.Dashboard);
