import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { JobState } from '../state/job-state';
import { JobForm } from '../job-form/job-form';
import { Job, JobStatus, getLatestJobUpdate } from '../models/job';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-job-form-page',
  imports: [JobForm, PageHeader, EmptyState, RouterLink],
  templateUrl: './job-form-page.html',
})
export class JobFormPage {
  private router = inject(Router);
  protected jobState = inject(JobState);
  private toast = inject(ToastService);

  id = input<string>();
  mode = input<'application'>();

  draft = signal<Job | undefined>(undefined);
  notFound = signal(false);
  saving = signal(false);
  protected isApplication = computed(() => this.mode() === 'application');
  protected isEditing = computed(() => !!this.id());

  protected pipeline = computed(() => {
    const job = this.draft();
    if (this.isApplication()) return true;
    return !!job?.jobUpdates.length && getLatestJobUpdate(job).status !== JobStatus.NEW;
  });

  protected heading = computed(() => {
    const editing = this.isEditing();
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

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.init(id));
    });
  }

  private async init(id: string | undefined): Promise<void> {
    this.notFound.set(false);
    if (!id) {
      this.draft.set({ company: '', role: '', jobDescription: '', jobUpdates: [] });
      return;
    }
    this.draft.set(undefined);
    const job = await this.jobState.openJob(id);
    if (this.id() !== id) return;
    if (job) this.draft.set(job);
    else this.notFound.set(true);
  }

  async onSave(job: Job): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      if (job.id) await this.updateExisting(job.id, job);
      else await this.createNew(job);
    } catch {
      this.toast.error('Could not save. Check your connection and try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private async updateExisting(id: string, job: Job): Promise<void> {
    const updates: Partial<Job> = {
      company: job.company,
      role: job.role,
      url: job.url,
      location: job.location,
      employmentType: job.employmentType,
      salary: job.salary,
      applicationDeadline: job.applicationDeadline,
      contact: job.contact,
      jobDescription: job.jobDescription,
      notes: job.notes,
    };
    if (job.jobUpdates !== this.draft()?.jobUpdates) updates.jobUpdates = job.jobUpdates;

    await this.jobState.updateJob(id, updates);
    const isSaved = getLatestJobUpdate(job).status === JobStatus.NEW;
    this.toast.success('Changes saved successfully.');
    this.router.navigate([isSaved ? '/jobs' : '/applications', id]);
  }

  private async createNew(job: Job): Promise<void> {
    const toSave: Job = job.jobUpdates?.length
      ? job
      : { ...job, jobUpdates: [{ status: JobStatus.NEW, updatedAt: new Date() }] };
    const saved = await this.jobState.addJob(toSave);
    const isApp = getLatestJobUpdate(toSave).status !== JobStatus.NEW;
    const base = isApp ? '/applications' : '/jobs';
    this.toast.success(
      isApp ? 'Application saved successfully.' : 'Job saved successfully.',
      isApp ? { label: 'Create tailored CV', link: [base, saved.id, 'cv'] } : undefined,
    );
    this.router.navigate([base, saved.id]);
  }

  onCancel(): void {
    const existing = this.draft();
    if (existing?.id) {
      const isSaved = getLatestJobUpdate(existing).status === JobStatus.NEW;
      this.router.navigate([isSaved ? '/jobs' : '/applications', existing.id]);
    } else {
      this.router.navigate([this.isApplication() ? '/applications' : '/jobs']);
    }
  }
}
