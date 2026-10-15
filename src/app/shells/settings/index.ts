export const loadSettingsPage = () =>
  import('./feature/settings-page/settings-page').then((m) => m.Settings);
export const loadDeleteAccountPage = () =>
  import('./feature/delete-account-page/delete-account-page').then((m) => m.DeleteAccountPage);
