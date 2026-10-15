import { Component, computed, input } from '@angular/core';
import { StatusChip } from '@shared/ui/status-chip/status-chip';
import { JobStatus } from '../../data/models/job';
import { STATUS_META } from '../../data/models/job-status-meta';

@Component({
  selector: 'app-job-status-chip',
  imports: [StatusChip],
  template: `<app-status-chip [label]="meta().label" [tone]="meta().tone" />`,
})
export class JobStatusChip {
  status = input.required<JobStatus>();
  meta = computed(() => STATUS_META[this.status()]);
}
