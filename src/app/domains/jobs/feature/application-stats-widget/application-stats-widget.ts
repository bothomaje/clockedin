import { Component, inject } from '@angular/core';
import { JobState } from '../../data/state/job-state';
import { StatCard } from '@shared/ui/stat-card/stat-card';

@Component({
  imports: [StatCard],
  selector: 'app-application-stats-widget',
  styleUrl: './application-stats-widget.scss',
  templateUrl: './application-stats-widget.html',
})
export class ApplicationStatsWidget {
  private state = inject(JobState);
  readonly stats = this.state.stats;
}
