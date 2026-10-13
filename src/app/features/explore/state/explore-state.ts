import { Service, computed, inject, signal } from '@angular/core';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { DiscoveryRepository } from '../data/discovery.repository';
import { ExploreSort, RecommendationRepository } from '../data/recommendation.repository';
import { Job } from '../../jobs/models/job';
import { JobState } from '../../jobs/state/job-state';
import { Recommendation } from '../models/recommendation';

@Service()
export class ExploreState {
  private recommendations = inject(RecommendationRepository);
  private discovery = inject(DiscoveryRepository);
  private jobState = inject(JobState);

  private itemsSignal = signal<Recommendation[]>([]);
  private cursor: QueryDocumentSnapshot | null = null;
  private touched = false;

  sort = signal<ExploreSort>('score');
  enabled = signal<boolean | null>(null);
  loading = signal(false);
  loadingMore = signal(false);
  hasMore = signal(false);
  error = signal('');

  items = computed(() => {
    const now = new Date();
    return this.itemsSignal().filter((r) => r.expireAt > now);
  });

  async init(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const enabled = await this.discovery.isEnabled();
      this.enabled.set(enabled);
      if (enabled) {
        this.touch();
        await this.loadFirst();
      }
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async enable(): Promise<void> {
    this.error.set('');
    try {
      await this.discovery.setEnabled(true);
      this.touched = true;
      this.enabled.set(true);
      await this.loadFirst();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  async setSort(sort: ExploreSort): Promise<void> {
    if (sort === this.sort()) return;
    this.sort.set(sort);
    this.loading.set(true);
    this.error.set('');
    try {
      await this.loadFirst();
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore() || this.loadingMore()) return;
    this.loadingMore.set(true);
    try {
      const page = await this.recommendations.getPage(this.sort(), this.cursor);
      this.itemsSignal.update((items) => [...items, ...page.items]);
      this.cursor = page.cursor;
      this.hasMore.set(page.hasMore);
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loadingMore.set(false);
    }
  }

  async find(id: string): Promise<Recommendation | undefined> {
    return this.itemsSignal().find((r) => r.id === id) ?? this.recommendations.get(id);
  }

  async save(rec: Recommendation): Promise<Job> {
    const job = await this.discovery.saveRecommendation(rec);
    this.jobState.adoptJob(job);
    this.remove(rec);
    return job;
  }

  async dismiss(rec: Recommendation): Promise<void> {
    await this.discovery.dismissRecommendation(rec);
    this.remove(rec);
  }

  private remove(rec: Recommendation): void {
    this.itemsSignal.update((items) => items.filter((r) => r.id !== rec.id));
  }

  private touch(): void {
    if (this.touched) return;
    this.touched = true;
    this.discovery.touchActive().catch(() => (this.touched = false));
  }

  private async loadFirst(): Promise<void> {
    this.cursor = null;
    const page = await this.recommendations.getPage(this.sort(), null);
    this.itemsSignal.set(page.items);
    this.cursor = page.cursor;
    this.hasMore.set(page.hasMore);
  }
}
