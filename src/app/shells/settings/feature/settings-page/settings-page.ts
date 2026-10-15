import { AccountSecurityPanel } from '@domains/identity';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { DatePipe } from '@angular/common';
import { PrivacyFacade } from '@domains/privacy';
import { DiscoverySettingsPanel, RecommendationsFacade } from '@domains/recommendations';
import { ProfileFacade } from '@domains/profile';
import { AuthSession } from '@core/auth/auth-session';
import { getAuthErrorMessage } from '@core/auth/auth-errors';

type Pane = 'account' | 'security' | 'discovery' | 'ai' | 'data';

@Component({
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    PageHeader,
    AccountSecurityPanel,
    DiscoverySettingsPanel,
  ],
  selector: 'app-settings',
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class Settings {
  private session = inject(AuthSession);
  private profile = inject(ProfileFacade);
  private privacy = inject(PrivacyFacade);

  readonly panes: { id: Pane; label: string }[] = [
    { id: 'account', label: 'Account Information' },
    { id: 'security', label: 'Password & Security' },
    { id: 'discovery', label: 'Job Matches' },
    { id: 'ai', label: 'AI Document Settings' },
    { id: 'data', label: 'Data Export / Backup' },
  ];
  pane = signal<Pane>('account');

  name = computed(() => this.profile.info().name ?? '');
  consentAt = computed(() => this.profile.user().aiConsentAt ?? null);
  revoking = signal(false);
  exporting = signal(false);
  exportError = signal('');

  email = this.session.currentUserSnapshot()?.email ?? '';
  emailVerified = this.session.isEmailVerified;
  verificationSent = signal(false);
  verificationError = signal('');
  isSendingVerification = signal(false);

  async resendVerification() {
    if (this.isSendingVerification() || this.verificationSent()) return;

    this.verificationError.set('');
    this.isSendingVerification.set(true);

    try {
      await this.session.sendVerificationEmail();
      this.verificationSent.set(true);
    } catch (err) {
      this.verificationError.set(getAuthErrorMessage(err));
    } finally {
      this.isSendingVerification.set(false);
    }
  }

  async revokeConsent() {
    this.revoking.set(true);
    try {
      await this.profile.revokeAiConsent();
    } finally {
      this.revoking.set(false);
    }
  }

  async exportData() {
    this.exportError.set('');
    this.exporting.set(true);
    try {
      await this.privacy.download();
    } catch {
      this.exportError.set('Could not export your data. Try again.');
    } finally {
      this.exporting.set(false);
    }
  }
}
