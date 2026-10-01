import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobState } from '../state/job-state';
import { JobDetail, StatusChangeEvent } from '../job-detail/job-detail';
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
export class JobSpecPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected jobState = inject(JobState);
  protected documentState = inject(DocumentState);
  protected profileState = inject(ProfileState);
  private toast = inject(ToastService);

  confirmingDelete = signal(false);

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

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    if (this.jobState.jobs().length === 0) await this.jobState.loadJobs();
    this.jobState.selectJob(id);
    await this.profileState.load();
    this.documentState.loadForJob(id);
  }

  async applyNow(): Promise<void> {
    const job = this.jobState.selectedJob();
    if (!job?.id) return;
    await this.jobState.updateJobStatus(job.id, JobStatus.APPLIED);
    this.toast.success('Moved to Applications.', {
      label: 'Create tailored CV',
      link: ['/applications', job.id, 'cv'],
    });
    this.router.navigate(['/applications', job.id]);
  }

  beginDelete(): void {
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  async confirmDelete(): Promise<void> {
    const job = this.jobState.selectedJob();
    if (!job?.id) return;
    await this.jobState.deleteJob(job.id);
    this.router.navigate(['/jobs']);
  }
}
