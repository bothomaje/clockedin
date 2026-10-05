import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { JobState } from '../../jobs/state/job-state';
import { DocumentState } from '../../documents/state/document-state';
import { ProfileState } from '../../profile/state/profile-state';
import { JobDetail, StatusChangeEvent } from '../../jobs/job-detail/job-detail';
import { AssociatedAssets } from '../../documents/associated-assets/associated-assets';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { getLatestJobUpdate, JobStatus } from '../../jobs/models/job';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-application-detail-page',
  imports: [JobDetail, ConfirmDialog, AssociatedAssets, EmptyState, RouterLink],
  templateUrl: './application-detail-page.html',
})
export class ApplicationDetailPage {
  id = input.required<string>();
  private router = inject(Router);
  private toast = inject(ToastService);
  protected jobState = inject(JobState);
  protected documentState = inject(DocumentState);
  protected profileState = inject(ProfileState);

  confirmingDelete = signal(false);
  deleting = signal(false);
  notFound = signal(false);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
  }

  private async load(id: string): Promise<void> {
    this.notFound.set(false);
    const [job] = await Promise.all([this.jobState.openJob(id), this.profileState.load()]);
    if (this.id() !== id) return;
    if (!job) {
      this.notFound.set(true);
      return;
    }
    if (job && getLatestJobUpdate(job).status === JobStatus.NEW) {
      this.router.navigate(['/jobs', id], { replaceUrl: true });
      return;
    }
    this.documentState.loadForJob(id);
  }

  async onStatusChange({ status, note }: StatusChangeEvent): Promise<void> {
    const job = this.jobState.selectedJob();
    if (!job?.id) return;
    try {
      await this.jobState.updateJobStatus(job.id, status, note);
    } catch {
      this.toast.error('Could not update status. Try again.');
    }
  }

  async onNotesSave(notes: string): Promise<void> {
    const job = this.jobState.selectedJob();
    if (!job?.id) return;
    try {
      await this.jobState.updateJob(job.id, { notes });
    } catch {
      this.toast.error('Could not save notes. Try again.');
    }
  }

  beginDelete(): void {
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  async confirmDelete(): Promise<void> {
    const job = this.jobState.selectedJob();
    if (!job?.id || this.deleting()) return;
    this.deleting.set(true);
    try {
      await this.jobState.deleteJob(job.id);
      this.router.navigate(['/applications']);
    } catch {
      this.confirmingDelete.set(false);
      this.toast.error('Could not delete this application. Try again.');
    } finally {
      this.deleting.set(false);
    }
  }
}
