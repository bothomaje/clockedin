import { Component, inject, signal } from '@angular/core';
import { AccountService } from '../../data/account.service';
import { getAuthErrorMessage } from '@core/auth/auth-errors';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-account-security-panel',
  styleUrl: './account-security-panel.scss',
  templateUrl: './account-security-panel.html',
})
export class AccountSecurityPanel {
  private state = inject(AccountService);

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  passwordMessage = signal('');
  passwordError = signal('');
  isSavingPassword = signal(false);

  get newPasswordValid(): boolean {
    return (
      this.newPassword.length >= 8 &&
      /[A-Za-z]/.test(this.newPassword) &&
      /[0-9]/.test(this.newPassword)
    );
  }

  get newPasswordsMatch(): boolean {
    return this.newPassword === this.confirmNewPassword;
  }

  async changePassword() {
    this.passwordError.set('');
    this.passwordMessage.set('');

    if (!this.newPasswordValid) {
      this.passwordError.set(
        'New password must be at least 8 characters and include a letter and a number.',
      );
      return;
    }
    if (!this.newPasswordsMatch) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.isSavingPassword.set(true);

    try {
      await this.state.changePassword(this.currentPassword, this.newPassword);
      this.passwordMessage.set('Password updated.');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    } catch (err) {
      this.passwordError.set(getAuthErrorMessage(err));
    } finally {
      this.isSavingPassword.set(false);
    }
  }
}
