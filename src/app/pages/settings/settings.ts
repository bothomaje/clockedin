import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { UserService } from '../../services/user-service';
import { Router } from '@angular/router';

@Component({
  imports: [FormsModule],
  selector: 'app-settings',
  templateUrl: './settings.html',
})
export class Settings {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  email = this.authService.currentUserSnapshot()?.email ?? '';
  emailVerified = this.authService.currentUserSnapshot()?.emailVerified ?? false;
  verificationSent = false;
  verificationError = '';
  isSendingVerification = false;

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  passwordMessage = '';
  passwordError = '';
  isSavingPassword = false;

  confirmingDelete = false;
  deletePassword = '';
  deleteError = '';
  isDeleting = false;

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
    if (this.isSendingVerification || this.verificationSent) return;

    this.verificationError = '';
    this.isSendingVerification = true;

    try {
      await this.authService.sendVerificationEmail();
      this.verificationSent = true;
    } catch (err) {
      this.verificationError = this.authService.getAuthErrorMessage(err);
    } finally {
      this.isSendingVerification = false;
      this.cdr.markForCheck();
    }
  }

  async changePassword() {
    this.passwordError = '';
    this.passwordMessage = '';

    if (!this.newPasswordValid) {
      this.passwordError =
        'New password must be at least 8 characters and include a letter and a number.';
      return;
    }
    if (!this.newPasswordsMatch) {
      this.passwordError = 'New passwords do not match.';
      return;
    }

    this.isSavingPassword = true;

    try {
      await this.authService.changePassword(this.currentPassword, this.newPassword);
      this.passwordMessage = 'Password updated.';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    } catch (err) {
      this.passwordError = this.authService.getAuthErrorMessage(err);
    } finally {
      this.isSavingPassword = false;
      this.cdr.markForCheck();
    }
  }

  beginDelete() {
    this.confirmingDelete = true;
    this.deleteError = '';
  }

  cancelDelete() {
    this.confirmingDelete = false;
    this.deletePassword = '';
  }

  async deleteAccount() {
    this.deleteError = '';
    this.isDeleting = true;

    try {
      const uid = this.authService.currentUserSnapshot()?.uid;
      if (!uid) throw new Error('No user is signed in.');

      await this.userService.deleteAllUserData(uid);
      await this.authService.deleteAccount(this.deletePassword);
      this.router.navigate(['/']);
    } catch (err) {
      this.deleteError = this.authService.getAuthErrorMessage(err);
    } finally {
      this.isDeleting = false;
      this.cdr.markForCheck();
    }
  }
}
