import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobState } from '../state/job-state';
import { getLatestJobUpdate, getSavedAt, JobStatus } from '../models/job';
import { AssociatedAssets } from '../../documents/associated-assets/associated-assets';
import { DocumentState } from '../../documents/state/document-state';
import { ProfileState } from '../../profile/state/profile-state';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DatePipe } from '@angular/common';
import { Breadcrumbs, Crumb } from '../../../shared/ui/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-job-spec-page',
  imports: [RouterLink, DatePipe, Breadcrumbs, AssociatedAssets, ConfirmDialog, EmptyState],
  templateUrl: './job-spec-page.html',
  styleUrl: './job-spec-page.scss',
})
export class JobSpecPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected jobState = inject(JobState);
  protected documentState = inject(DocumentState);
  protected profileState = inject(ProfileState);
  private toast = inject(ToastService);

  id = input.required<string>();
  confirmingDelete = signal(false);
  deleting = signal(false);
  notFound = signal(false);

  linked = computed(() => {
    const job = this.jobState.selectedJob();
    return !!job && getLatestJobUpdate(job).status !== JobStatus.NEW;
  });
  savedAt = computed(() => {
    const job = this.jobState.selectedJob();
    return job ? getSavedAt(job) : undefined;
  });
  crumbs = computed<Crumb[]>(() => [
    { label: 'Jobs', link: '/jobs' },
    { label: `${this.jobState.selectedJob()?.role || 'Untitled'} specification` },
  ]);

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
    this.documentState.loadForJob(id);
  }

  async applyNow(): Promise<void> {
    const job = this.jobState.selectedJob();
    if (!job?.id) return;
    try {
      await this.jobState.updateJobStatus(job.id, JobStatus.APPLIED);
      this.toast.success('Moved to Applications.', {
        label: 'Create tailored CV',
        link: ['/applications', job.id, 'cv'],
      });
      this.router.navigate(['/applications', job.id]);
    } catch {
      this.toast.error('Could not update this job. Try again.');
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
      this.router.navigate(['/jobs']);
    } catch {
      this.confirmingDelete.set(false);
      this.toast.error('Could not delete this job. Try again.');
    } finally {
      this.deleting.set(false);
    }
  }
}
