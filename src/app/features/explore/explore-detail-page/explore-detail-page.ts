import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobLocationPipe } from '../../../domains/jobs/util/job-location.pipe';
import { WORK_MODE_LABELS } from '@shared/location/location.model';
import { providerLabel } from '../data/recommendation.mapper';
import { Recommendation } from '../models/recommendation';
import { ExploreState } from '../state/explore-state';

@Component({
  selector: 'app-explore-detail-page',
  imports: [DatePipe, RouterLink, JobLocationPipe],
  templateUrl: './explore-detail-page.html',
})
export class ExploreDetailPage implements OnInit {
  private state = inject(ExploreState);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  rec = signal<Recommendation | undefined>(undefined);
  loading = signal(true);
  busy = signal(false);
  error = signal('');

  workModeLabels = WORK_MODE_LABELS;
  providerLabel = providerLabel;

  async ngOnInit(): Promise<void> {
    try {
      const id = this.route.snapshot.paramMap.get('id');
      this.rec.set(id ? await this.state.find(id) : undefined);
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const rec = this.rec();
    if (!rec) return;
    await this.run(async () => {
      const job = await this.state.save(rec);
      await this.router.navigate(['/jobs', job.id]);
    });
  }

  async dismiss(): Promise<void> {
    const rec = this.rec();
    if (!rec) return;
    await this.run(async () => {
      await this.state.dismiss(rec);
      await this.router.navigate(['/explore']);
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
