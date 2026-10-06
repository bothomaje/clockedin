import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APPLICATION_STATUSES, getDateApplied, Job, JobStatus, JobUpdate } from '../models/job';
import { statusLabel } from '../../../shared/ui/status-chip/status-chip';
import { DateField } from '../../../shared/ui/date-field/date-field';
import { Select, SelectOption } from '../../../shared/ui/select/select';
import { LocationInput } from '../../../shared/ui/location-input/location-input';
import { WORK_MODE_LABELS, WorkMode } from '../../../shared/location/location.model';

@Component({
  selector: 'app-job-form',
  imports: [FormsModule, DateField, Select, LocationInput],
  templateUrl: './job-form.html',
})
export class JobForm {
  job = input.required<Job>();
  pipeline = input(true);
  showStatus = input(false);
  submitLabel = input('Save');
  save = output<Job>();
  cancel = output<void>();

  editedJob!: Job;
  status = JobStatus.APPLIED;
  dateApplied: Date | null | undefined = null;
  statusSelectOptions: SelectOption<JobStatus>[] = APPLICATION_STATUSES.map((status) => ({
    value: status,
    label: statusLabel(status),
  }));
  workModeSelectOptions: SelectOption<WorkMode | ''>[] = [
    { value: '', label: 'Not specified' },
    ...(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((value) => ({
      value,
      label: WORK_MODE_LABELS[value],
    })),
  ];
  get workModeValue(): WorkMode | '' {
    return this.editedJob.workMode ?? '';
  }
  set workModeValue(value: WorkMode | '') {
    this.editedJob.workMode = value || null;
  }

  constructor() {
    effect(() => {
      this.editedJob = { ...this.job() };
      this.dateApplied = getDateApplied(this.editedJob);
    });
  }

  onSubmit(): void {
    const job = { ...this.editedJob };
    if (job.workMode === 'remote') job.location = null;
    if (!job.id && this.showStatus()) {
      job.jobUpdates = this.newApplicationUpdates();
    } else if (job.id) {
      job.jobUpdates = this.withDateApplied(job.jobUpdates);
    }
    this.save.emit(job);
  }

  private newApplicationUpdates(): JobUpdate[] {
    const updates: JobUpdate[] = [];
    if (this.dateApplied) {
      updates.push({ status: JobStatus.APPLIED, updatedAt: this.dateApplied });
    }
    if (!updates.length || this.status !== JobStatus.APPLIED) {
      updates.push({ status: this.status, updatedAt: new Date() });
    }
    return updates;
  }

  private withDateApplied(updates: JobUpdate[]): JobUpdate[] {
    const next = this.dateApplied;
    const current = getDateApplied({ ...this.editedJob, jobUpdates: updates });
    if (!next || current?.getTime() === next.getTime()) return updates;

    const copy = updates.map((update) => ({ ...update }));
    const applied = copy
      .filter((update) => update.status === JobStatus.APPLIED)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

    if (applied) applied.updatedAt = next;
    else copy.push({ status: JobStatus.APPLIED, updatedAt: next });
    return copy;
  }
}
