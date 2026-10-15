import { inject, Service } from '@angular/core';
import { AuthSession } from '@core/auth/auth-session';
import {
  Auth,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

@Service()
export class AccountService {
  private session = inject(AuthSession);

  async reauthenticate(currentPassword: string) {
    const user = this.session.requireUser();
    if (!user?.email) throw new Error('No user is signed in.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.reauthenticate(currentPassword);
    await updatePassword(this.session.requireUser(), newPassword);
  }

  async deleteAuthAccount(): Promise<void> {
    await deleteUser(this.session.requireUser());
  }
}
