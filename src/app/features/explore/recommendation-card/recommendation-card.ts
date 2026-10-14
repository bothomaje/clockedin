import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { JobLocationPipe } from '../../../domains/jobs/util/job-location.pipe';
import { WORK_MODE_LABELS } from '../../../shared/location/location.model';
import { providerLabel } from '../data/recommendation.mapper';
import { Recommendation } from '../models/recommendation';

@Component({
  selector: 'app-recommendation-card',
  imports: [DatePipe, JobLocationPipe],
  templateUrl: './recommendation-card.html',
})
export class RecommendationCard {
  rec = input.required<Recommendation>();
  busy = input(false);
  view = output<Recommendation>();
  save = output<Recommendation>();
  dismiss = output<Recommendation>();

  workModeLabels = WORK_MODE_LABELS;
  providerLabel = providerLabel;
}
