import { Component, inject } from '@angular/core';
import { JobState } from '../../data/state/job-state';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-follow-ups-widget',
  styleUrl: './follow-ups-widget.scss',
  templateUrl: './follow-ups-widget.html',
})
export class FollowUpsWidget {
  private state = inject(JobState);
  protected followUps = this.state.followUps;
}
