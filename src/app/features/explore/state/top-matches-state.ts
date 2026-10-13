import { Service, inject, signal } from '@angular/core';
import { JobState } from '../../jobs/state/job-state';
import { DiscoveryRepository } from '../data/discovery.repository';
import { RecommendationRepository } from '../data/recommendation.repository';
import { Recommendation, isVisible } from '../models/recommendation';

const SHOWN = 3;
const FETCHED = 10;

const time = (r: Recommendation) => r.job.postedAt?.getTime() ?? 0;

@Service()
export class TopMatchesState {
  private recommendations = inject(RecommendationRepository);
  private discovery = inject(DiscoveryRepository);
  private jobState = inject(JobState);

  enabled = signal<boolean | null>(null);
  items = signal<Recommendation[]>([]);
  busyId = signal<string | undefined>(undefined);
  error = signal(false);
  actionError = signal('');

  async load(): Promise<void> {
    this.error.set(false);
    try {
      const prefs = await this.discovery.loadPreferences();
      this.enabled.set(prefs.enabled);
      if (!prefs.enabled) {
        this.items.set([]);
        return;
      }
      const top = await this.recommendations.getTop(FETCHED);
      this.items.set(
        top
          .filter((r) => isVisible(r, prefs.sources))
          .sort((a, b) => b.score - a.score || time(b) - time(a))
          .slice(0, SHOWN),
      );
    } catch {
      this.error.set(true);
    }
  }

  async save(rec: Recommendation): Promise<void> {
    this.busyId.set(rec.id);
    this.actionError.set('');
    try {
      this.jobState.adoptJob(await this.discovery.saveRecommendation(rec));
      this.items.update((items) => items.filter((r) => r.id !== rec.id));
    } catch {
      this.actionError.set('Could not save this job. Try again.');
    } finally {
      this.busyId.set(undefined);
    }
  }
}
