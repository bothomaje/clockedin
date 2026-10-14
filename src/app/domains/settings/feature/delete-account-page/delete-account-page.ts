import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { DataExportService } from '../../data/data-export.service';
import { ProfileFacade } from '@domains/profile';
import { AuthSession } from '@core/auth/auth-session';
import { getAuthErrorMessage } from '@core/auth/auth-errors';
import { AccountService } from '../../data/account.service';

@Component({
  selector: 'app-delete-account-page',
  imports: [FormsModule, RouterLink, PageHeader],
  templateUrl: './delete-account-page.html',
  styleUrl: './delete-account-page.scss',
})
export class DeleteAccountPage {
  private session = inject(AuthSession);
  private account = inject(AccountService);
  private profile = inject(ProfileFacade);
  private router = inject(Router);
  private exporter = inject(DataExportService);

  name = computed(() => this.profile.info().name ?? '');
  understood = false;
  password = '';
  error = signal('');
  isDeleting = signal(false);
  exporting = signal(false);
  exportError = signal('');

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

  async deleteAccount() {
    this.error.set('');
    this.isDeleting.set(true);
    try {
      const uid = this.session.currentUserSnapshot()?.uid;
      if (!uid) throw new Error('No user is signed in.');

      await this.account.reauthenticate(this.password);
      await this.profile.deleteAllData();
      await this.account.deleteAuthAccount();
      this.router.navigate(['/']);
    } catch (err) {
      this.error.set(getAuthErrorMessage(err));
    } finally {
      this.isDeleting.set(false);
    }
  }
}
