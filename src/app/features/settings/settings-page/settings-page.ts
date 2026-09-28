import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { ProfileState } from '../../profile/state/profile-state';

@Component({
  imports: [FormsModule],
  selector: 'app-settings',
  templateUrl: './settings-page.html',
})
export class Settings {
  private authService = inject(AuthService);
  private profileState = inject(ProfileState);
  private router = inject(Router);

  email = this.authService.currentUserSnapshot()?.email ?? '';
  emailVerified = this.authService.currentUserSnapshot()?.emailVerified ?? false;
  verificationSent = signal(false);
  verificationError = signal('');
  isSendingVerification = signal(false);

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  passwordMessage = signal('');
  passwordError = signal('');
  isSavingPassword = signal(false);

  confirmingDelete = signal(false);
  deletePassword = '';
  deleteError = signal('');
  isDeleting = signal(false);

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

  async resendVerification() {
    if (this.isSendingVerification() || this.verificationSent()) return;

    this.verificationError.set('');
    this.isSendingVerification.set(true);

    try {
      await this.authService.sendVerificationEmail();
      this.verificationSent.set(true);
    } catch (err) {
      this.verificationError.set(this.authService.getAuthErrorMessage(err));
    } finally {
      this.isSendingVerification.set(false);
    }
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
      await this.authService.changePassword(this.currentPassword, this.newPassword);
      this.passwordMessage.set('Password updated.');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    } catch (err) {
      this.passwordError.set(this.authService.getAuthErrorMessage(err));
    } finally {
      this.isSavingPassword.set(false);
    }
  }

  beginDelete() {
    this.confirmingDelete.set(true);
    this.deleteError.set('');
  }

  cancelDelete() {
    this.confirmingDelete.set(false);
    this.deletePassword = '';
  }

  async deleteAccount() {
    this.deleteError.set('');
    this.isDeleting.set(true);

    try {
      const uid = this.authService.currentUserSnapshot()?.uid;
      if (!uid) throw new Error('No user is signed in.');

      await this.authService.reauthenticate(this.deletePassword);
      await this.profileState.deleteAllData();
      await this.authService.deleteAuthAccount();
      this.router.navigate(['/']);
    } catch (err) {
      this.deleteError.set(this.authService.getAuthErrorMessage(err));
    } finally {
      this.isDeleting.set(false);
    }
  }
}
