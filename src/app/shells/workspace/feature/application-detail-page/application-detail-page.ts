import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DocumentsFacade, AssociatedAssets } from '@domains/documents';
import {
  JobDetail,
  StatusChangeEvent,
  JobsFacade,
  getLatestJobUpdate,
  JobStatus,
} from '@domains/jobs';
import { ConfirmDialog } from '@shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ToastService } from '@shared/ui/toast/toast.service';
import { ProfileFacade } from '@domains/profile';

@Component({
  selector: 'app-application-detail-page',
  imports: [JobDetail, ConfirmDialog, AssociatedAssets, EmptyState, RouterLink],
  templateUrl: './application-detail-page.html',
})
export class ApplicationDetailPage {
  id = input.required<string>();
  private router = inject(Router);
  private toast = inject(ToastService);
  protected jobs = inject(JobsFacade);
  protected documents = inject(DocumentsFacade);
  protected profile = inject(ProfileFacade);

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
    const [job] = await Promise.all([this.jobs.openJob(id), this.profile.ensureLoaded()]);
    if (this.id() !== id) return;
    if (!job) {
      this.notFound.set(true);
      return;
    }
    if (job && getLatestJobUpdate(job).status === JobStatus.NEW) {
      this.router.navigate(['/jobs', id], { replaceUrl: true });
      return;
    }
    this.documents.loadForJob(id);
  }

  async onStatusChange({ status, note }: StatusChangeEvent): Promise<void> {
    const job = this.jobs.selectedJob();
    if (!job?.id) return;
    try {
      await this.jobs.updateJobStatus(job.id, status, note);
    } catch {
      this.toast.error('Could not update status. Try again.');
    }
  }

  async onNotesSave(notes: string): Promise<void> {
    const job = this.jobs.selectedJob();
    if (!job?.id) return;
    try {
      await this.jobs.updateJob(job.id, { notes });
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
    const job = this.jobs.selectedJob();
    if (!job?.id || this.deleting()) return;
    this.deleting.set(true);
    try {
      await this.jobs.deleteJob(job.id);
      this.router.navigate(['/applications']);
    } catch {
      this.confirmingDelete.set(false);
      this.toast.error('Could not delete this application. Try again.');
    } finally {
      this.deleting.set(false);
    }
  }
}
