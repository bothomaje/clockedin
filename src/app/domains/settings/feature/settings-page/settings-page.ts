import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { RouterLink } from '@angular/router';
import { ProfileState } from '../../../profile/data/state/profile-state';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { DatePipe } from '@angular/common';
import { DataExportService } from '../../data/data-export.service';
import { DiscoveryRepository } from '../../../recommendations/data/repositories/discovery.repository';
import { DISCOVERY_SOURCES } from '../../../recommendations/data/models/discovery-sources';
import { AuthSession } from '@core/auth/auth-session';

type Pane = 'account' | 'security' | 'discovery' | 'ai' | 'data';

@Component({
  imports: [FormsModule, DatePipe, RouterLink, PageHeader],
  selector: 'app-settings',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class Settings {
  private auth = inject(AuthService);
  private session = inject(AuthSession);
  private profileState = inject(ProfileState);
  private exporter = inject(DataExportService);
  private discovery = inject(DiscoveryRepository);

  readonly panes: { id: Pane; label: string }[] = [
    { id: 'account', label: 'Account Information' },
    { id: 'security', label: 'Password & Security' },
    { id: 'discovery', label: 'Job Matches' },
    { id: 'ai', label: 'AI Document Settings' },
    { id: 'data', label: 'Data Export / Backup' },
  ];
  pane = signal<Pane>('account');

  name = computed(() => this.profileState.info().name ?? '');
  consentAt = computed(() => this.profileState.user().aiConsentAt ?? null);
  revoking = signal(false);
  exporting = signal(false);
  exportError = signal('');

  readonly discoverySources = DISCOVERY_SOURCES;
  discoveryLoaded = signal(false);
  discoveryBusy = signal(false);
  discoveryError = signal('');
  discoveryEnabled = signal(false);
  selectedSources = signal<string[]>([]);

  constructor() {
    void this.loadDiscovery();
  }

  email = this.session.currentUserSnapshot()?.email ?? '';
  emailVerified = this.session.isEmailVerified;
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
      await this.auth.sendVerificationEmail();
      this.verificationSent.set(true);
    } catch (err) {
      this.verificationError.set(this.auth.getAuthErrorMessage(err));
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
      await this.auth.changePassword(this.currentPassword, this.newPassword);
      this.passwordMessage.set('Password updated.');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    } catch (err) {
      this.passwordError.set(this.auth.getAuthErrorMessage(err));
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

  private async loadDiscovery() {
    try {
      const prefs = await this.discovery.loadPreferences();
      this.discoveryEnabled.set(prefs.enabled);
      this.selectedSources.set(prefs.sources);
      this.discoveryLoaded.set(true);
    } catch {
      this.discoveryError.set('Could not load job match settings.');
    }
  }

  async toggleSource(id: string, checked: boolean) {
    const previous = this.selectedSources();
    const next = checked ? [...previous, id] : previous.filter((s) => s !== id);
    if (!next.length) return;
    await this.saveDiscovery(
      () => this.discovery.setSources(next),
      () => {
        this.selectedSources.set(next);
      },
      () => this.selectedSources.set(previous),
    );
  }

  async setDiscoveryEnabled(enabled: boolean) {
    await this.saveDiscovery(
      () => this.discovery.setEnabled(enabled),
      () => {
        this.discoveryEnabled.set(enabled);
      },
    );
  }

  private async saveDiscovery(write: () => Promise<void>, apply: () => void, revert?: () => void) {
    this.discoveryError.set('');
    this.discoveryBusy.set(true);
    apply();
    try {
      await write();
    } catch {
      revert?.();
      this.discoveryError.set('Could not save. Try again.');
      if (!revert) void this.loadDiscovery();
    } finally {
      this.discoveryBusy.set(false);
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
