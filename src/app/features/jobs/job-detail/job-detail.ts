import { Component, computed, effect, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Job, JobStatus, getDateApplied, getLatestJobUpdate } from '../models/job';
import { StatusChip, statusLabel } from '../../../shared/ui/status-chip/status-chip';
import { RouterLink } from '@angular/router';
import { Breadcrumbs, Crumb } from '../../../shared/ui/breadcrumbs/breadcrumbs';
import { Modal } from '../../../shared/ui/modal/modal';
import { Select, SelectOption } from '../../../shared/ui/select/select';
import { JobLocationPipe } from '../models/job-location.pipe';

export interface StatusChangeEvent {
  status: JobStatus;
  note: string;
}

type DetailModal = 'status' | 'event' | null;

@Component({
  selector: 'app-job-detail',
  imports: [
    FormsModule,
    DatePipe,
    StatusChip,
    RouterLink,
    Breadcrumbs,
    Modal,
    Select,
    JobLocationPipe,
  ],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.scss',
})
export class JobDetail {
  job = input.required<Job>();
  section = input<'applications' | 'jobs'>('applications');
  close = output<void>();
  statusChange = output<StatusChangeEvent>();
  notesSave = output<string>();
  deleteRequested = output<void>();

  modal = signal<DetailModal>(null);
  editingNotes = signal(false);
  notesDraft = '';
  eventNote = '';
  nextStatus: JobStatus = JobStatus.NEW;
  statuses = Object.values(JobStatus);
  statusSelectOptions: SelectOption<JobStatus>[] = this.statuses.map((status) => ({
    value: status,
    label: statusLabel(status),
  }));
  statusLabel = statusLabel;
  getDateApplied = getDateApplied;

  latest = computed(() => getLatestJobUpdate(this.job()));
  crumbs = computed<Crumb[]>(() => [
    { label: this.section() === 'jobs' ? 'Jobs' : 'Applications', link: `/${this.section()}` },
    { label: this.job().company || 'Untitled' },
  ]);
  editLink = computed(() => ['/', this.section(), this.job().id, 'edit']);
  urlLabel = computed(() =>
    (this.job().url ?? '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
  );
  timeline = computed(() =>
    [...this.job().jobUpdates].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime()),
  );

  constructor() {
    effect(() => {
      this.notesDraft = this.job().notes ?? '';
      this.nextStatus = getLatestJobUpdate(this.job()).status;
    });
  }

  openModal(kind: Exclude<DetailModal, null>): void {
    this.nextStatus = this.latest().status;
    this.eventNote = '';
    this.modal.set(kind);
  }

  submitModal(): void {
    const kind = this.modal();
    if (!kind) return;
    const note = this.eventNote.trim();
    if (kind === 'event' && !note) return;
    this.statusChange.emit({
      status: kind === 'event' ? this.latest().status : this.nextStatus,
      note,
    });
    this.modal.set(null);
  }

  saveNotes(): void {
    this.notesSave.emit(this.notesDraft);
    this.editingNotes.set(false);
  }

  cancelNotes(): void {
    this.notesDraft = this.job().notes ?? '';
    this.editingNotes.set(false);
  }
}
