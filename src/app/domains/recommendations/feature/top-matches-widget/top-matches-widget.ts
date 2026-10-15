import { Component, inject } from '@angular/core';
import { TopMatchesState } from '../../data/state/top-matches-state';
import { RouterLink } from '@angular/router';
import { JobLocationPipe } from '@domains/jobs';
import { WORK_MODE_LABELS } from '@shared/location/location.model';

@Component({
  imports: [RouterLink, JobLocationPipe],
  selector: 'app-top-matches-widget',
  styleUrl: './top-matches-widget.scss',
  templateUrl: './top-matches-widget.html',
})
export class TopMatchesWidget {
  private state = inject(TopMatchesState);
  workModeLabels = WORK_MODE_LABELS;

  constructor() {
    void this.state.load();
  }
}
