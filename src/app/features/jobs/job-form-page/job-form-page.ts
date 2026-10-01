import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JobState } from '../state/job-state';
import { JobForm } from '../job-form/job-form';
import { Job, JobStatus, getLatestJobUpdate } from '../models/job';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-job-form-page',
  imports: [JobForm, PageHeader],
  templateUrl: './job-form-page.html',
})
export class JobFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobState = inject(JobState);
  private toast = inject(ToastService);

  draft = signal<Job | undefined>(undefined);
  protected isApplication = this.route.snapshot.data['mode'] === 'application';
  protected isEditing = !!this.route.snapshot.paramMap.get('id');

  protected pipeline = computed(() => {
    const job = this.draft();
    if (this.isApplication) return true;
    return !!job?.jobUpdates.length && getLatestJobUpdate(job).status !== JobStatus.NEW;
  });

  protected heading = computed(() => {
    const editing = this.isEditing;
    return this.pipeline()
      ? {
          eyebrow: editing ? 'Application' : 'Add application',
          title: editing ? 'Edit application' : 'Add application',
          submit: editing ? 'Save changes' : 'Save application',
        }
      : {
          eyebrow: 'Saved jobs',
          title: editing ? 'Edit job' : 'Save a job',
          submit: editing ? 'Save changes' : 'Save job',
        };
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      if (this.jobState.jobs().length === 0) await this.jobState.loadJobs();
      this.jobState.selectJob(id);
      this.draft.set(this.jobState.selectedJob());
    } else {
      this.draft.set({ company: '', role: '', jobDescription: '', jobUpdates: [] });
    }
  }

  async onSave(job: Job): Promise<void> {
    if (job.id) {
      const { id, ...updates } = job;
      console.log(updates);
      await this.jobState.updateJob(id, updates);
      const isSaved = getLatestJobUpdate(job).status === JobStatus.NEW;
      this.toast.success('Changes saved successfully.');
      this.router.navigate([isSaved ? '/jobs' : '/applications', id]);
    } else {
      if (!job.jobUpdates?.length) {
        job.jobUpdates = [{ status: JobStatus.NEW, updatedAt: new Date() }];
      }
      const saved = await this.jobState.addJob(job);
      const isApp = getLatestJobUpdate(job).status !== JobStatus.NEW;
      const base = isApp ? '/applications' : '/jobs';
      this.toast.success(
        isApp ? 'Application saved successfully.' : 'Job saved successfully.',
        isApp ? { label: 'Create tailored CV', link: [base, saved.id, 'cv'] } : undefined,
      );
      this.router.navigate([base, saved.id]);
    }
  }

  onCancel(): void {
    const existing = this.draft();
    if (existing?.id) {
      const isSaved = getLatestJobUpdate(existing).status === JobStatus.NEW;
      this.router.navigate([isSaved ? '/jobs' : '/applications', existing.id]);
    } else {
      this.router.navigate([this.isApplication ? '/applications' : '/jobs']);
    }
  }
}
