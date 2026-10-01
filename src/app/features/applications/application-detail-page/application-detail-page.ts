import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobState } from '../../jobs/state/job-state';
import { DocumentState } from '../../documents/state/document-state';
import { ProfileState } from '../../profile/state/profile-state';
import { JobDetail, StatusChangeEvent } from '../../jobs/job-detail/job-detail';
import { AssociatedAssets } from '../../documents/associated-assets/associated-assets';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { getLatestJobUpdate, JobStatus } from '../../jobs/models/job';

@Component({
  selector: 'app-application-detail-page',
  imports: [JobDetail, ConfirmDialog, AssociatedAssets],
  templateUrl: './application-detail-page.html',
})
export class ApplicationDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected jobState = inject(JobState);
  protected documentState = inject(DocumentState);
  protected profileState = inject(ProfileState);

  confirmingDelete = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    await this.profileState.load();
    if (this.jobState.jobs().length === 0) await this.jobState.loadJobs();
    this.jobState.selectJob(id);
    const job = this.jobState.selectedJob();
    if (job && getLatestJobUpdate(job).status === JobStatus.NEW) {
      this.router.navigate(['/jobs', id], { replaceUrl: true });
      return;
    }
    this.documentState.loadForJob(id);
  }

  async onStatusChange({ status, note }: StatusChangeEvent): Promise<void> {
    const job = this.jobState.selectedJob();
    if (job?.id) await this.jobState.updateJobStatus(job.id, status, note);
  }

  async onNotesSave(notes: string): Promise<void> {
    const job = this.jobState.selectedJob();
    if (job?.id) await this.jobState.updateJob(job.id, { notes });
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
    this.router.navigate(['/applications']);
  }
}
