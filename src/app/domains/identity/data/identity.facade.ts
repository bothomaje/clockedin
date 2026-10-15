import { inject, Service } from '@angular/core';
import { AccountService } from './account.service';

@Service()
export class IdentityFacade {
  private account = inject(AccountService);

  reauthenticate = (currentPassword: string) => this.account.reauthenticate(currentPassword);
  changePassword = (currentPassword: string, newPassword: string) =>
    this.account.changePassword(currentPassword, newPassword);
  deleteAuthAccount = () => this.account.deleteAuthAccount();
}
