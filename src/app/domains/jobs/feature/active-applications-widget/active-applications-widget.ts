import { Component, inject } from '@angular/core';
import { JobState } from '../../data/state/job-state';
import { RouterLink } from '@angular/router';
import { getLatestJobUpdate } from '../../data/models/job';
import { JobStatusChip } from '../../ui/job-status-chip/job-status-chip';

@Component({
  imports: [RouterLink, JobStatusChip],
  selector: 'app-active-applications-widget',
  styleUrl: './active-applications-widget.scss',
  templateUrl: './active-applications-widget.html',
})
export class ActiveApplicationsWidget {
  private state = inject(JobState);
  readonly activeApplications = this.state.activeApplications;

  getLatestJobUpdate = getLatestJobUpdate;
}
