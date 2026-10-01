import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfileState } from '../../profile/state/profile-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { DataExportService } from '../data-export.service';

@Component({
  selector: 'app-delete-account-page',
  imports: [FormsModule, RouterLink, PageHeader],
  templateUrl: './delete-account-page.html',
  styleUrl: './delete-account-page.scss',
})
export class DeleteAccountPage {
  private authService = inject(AuthService);
  private profileState = inject(ProfileState);
  private router = inject(Router);
  private exporter = inject(DataExportService);

  name = computed(() => this.profileState.info().name ?? '');
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
      const uid = this.authService.currentUserSnapshot()?.uid;
      if (!uid) throw new Error('No user is signed in.');

      await this.authService.reauthenticate(this.password);
      await this.profileState.deleteAllData();
      await this.authService.deleteAuthAccount();
      this.router.navigate(['/']);
    } catch (err) {
      this.error.set(this.authService.getAuthErrorMessage(err));
    } finally {
      this.isDeleting.set(false);
    }
  }
}
