import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ProfileState } from '../../profile/state/profile-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { DatePipe } from '@angular/common';
import { DataExportService } from '../data-export.service';

type Pane = 'account' | 'security' | 'ai' | 'data';

@Component({
  imports: [FormsModule, DatePipe, RouterLink, PageHeader],
  selector: 'app-settings',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class Settings {
  private authService = inject(AuthService);
  private profileState = inject(ProfileState);
  private exporter = inject(DataExportService);

  readonly panes: { id: Pane; label: string }[] = [
    { id: 'account', label: 'Account Information' },
    { id: 'security', label: 'Password & Security' },
    { id: 'ai', label: 'AI Document Settings' },
    { id: 'data', label: 'Data Export / Backup' },
  ];
  pane = signal<Pane>('account');

  name = computed(() => this.profileState.info().name ?? '');
  consentAt = computed(() => this.profileState.user().aiConsentAt ?? null);
  revoking = signal(false);
  exporting = signal(false);
  exportError = signal('');

  email = this.authService.currentUserSnapshot()?.email ?? '';
  emailVerified = this.authService.isEmailVerified;
  verificationSent = signal(false);
  verificationError = signal('');
  isSendingVerification = signal(false);

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

  async revokeConsent() {
    this.revoking.set(true);
    try {
      await this.profileState.revokeAiConsent();
    } finally {
      this.revoking.set(false);
    }
  }

  async exportData() {
    this.exportError.set('');
    this.exporting.set(true);
    try {
      await this.exporter.download();
    } catch {
      this.exportError.set('Could not export your data. Try again.');
    } finally {
      this.exporting.set(false);
    }
  }
}
