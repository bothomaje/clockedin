import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Select, SelectOption } from '@shared/ui/select/select';
import { WORK_MODE_LABELS } from '@shared/location/location.model';
import { jobLocationLabel } from '@domains/jobs';
import { providerLabel } from '../../data/repositories/recommendation.mapper';
import { ExploreSort } from '../../data/repositories/recommendation.repository';
import { Recommendation } from '../../data/models/recommendation';
import { RecommendationCard } from '../../ui/recommendation-card/recommendation-card';
import { ExploreState } from '../../data/state/explore-state';

const DAY_MS = 86_400_000;

@Component({
  selector: 'app-explore-page',
  imports: [FormsModule, PageHeader, Select, EmptyState, ErrorState, RecommendationCard],
  templateUrl: './explore-page.html',
})
export class ExplorePage implements OnInit {
  protected state = inject(ExploreState);
  private router = inject(Router);

  search = signal('');
  source = signal('');
  workMode = signal('');
  employment = signal('');
  posted = signal('');
  quality = signal('');
  busyId = signal<string | undefined>(undefined);
  actionError = signal('');

  ngOnInit(): void {
    void this.state.init();
  }

  private distinct(pick: (r: Recommendation) => string | undefined): string[] {
    return [
      ...new Set(
        this.state
          .items()
          .map(pick)
          .filter((v): v is string => !!v?.trim()),
      ),
    ].sort();
  }

  sourceOptions = computed<SelectOption<string>[]>(() => [
    { value: '', label: 'All sources' },
    ...this.distinct((r) => r.job.source?.provider).map((p) => ({
      value: p,
      label: providerLabel(p),
    })),
  ]);
  workModeOptions = computed<SelectOption<string>[]>(() => [
    { value: '', label: 'Any work mode' },
    ...this.distinct((r) => r.job.workMode ?? undefined).map((m) => ({
      value: m,
      label: WORK_MODE_LABELS[m as keyof typeof WORK_MODE_LABELS] ?? m,
    })),
  ]);
  employmentOptions = computed<SelectOption<string>[]>(() => [
    { value: '', label: 'Any type' },
    ...this.distinct((r) => r.job.employmentType).map((t) => ({ value: t, label: t })),
  ]);
  postedOptions: SelectOption<string>[] = [
    { value: '', label: 'Any date' },
    { value: '3', label: 'Last 3 days' },
    { value: '7', label: 'Last 7 days' },
  ];
  qualityOptions: SelectOption<string>[] = [
    { value: '', label: 'Any match' },
    { value: '50', label: '50%+ match' },
    { value: '70', label: '70%+ match' },
    { value: '85', label: '85%+ match' },
  ];
  sortOptions: SelectOption<ExploreSort>[] = [
    { value: 'score', label: 'Best match' },
    { value: 'postedAt', label: 'Newest' },
  ];

  activeFilterCount = computed(
    () =>
      [this.source(), this.workMode(), this.employment(), this.posted(), this.quality()].filter(
        Boolean,
      ).length,
  );
  hasActiveFilters = computed(() => this.activeFilterCount() > 0 || !!this.search().trim());

  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const days = Number(this.posted());
    const minScore = Number(this.quality());
    const cutoff = days ? Date.now() - days * DAY_MS : 0;

    return this.state.items().filter((r) => {
      const j = r.job;
      if (this.source() && j.source?.provider !== this.source()) return false;
      if (this.workMode() && j.workMode !== this.workMode()) return false;
      if (this.employment() && j.employmentType !== this.employment()) return false;
      if (minScore && r.score < minScore) return false;
      if (cutoff && (!j.postedAt || j.postedAt.getTime() < cutoff)) return false;
      if (term) {
        const haystack = `${j.role} ${j.company} ${jobLocationLabel(j)}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });

  clearFilters(): void {
    this.search.set('');
    this.source.set('');
    this.workMode.set('');
    this.employment.set('');
    this.posted.set('');
    this.quality.set('');
  }

  onView(rec: Recommendation): void {
    void this.router.navigate(['/explore', rec.id]);
  }

  async onSave(rec: Recommendation): Promise<void> {
    await this.act(rec, async () => {
      await this.state.save(rec);
    });
  }

  async onDismiss(rec: Recommendation): Promise<void> {
    await this.act(rec, () => this.state.dismiss(rec));
  }

  private async act(rec: Recommendation, run: () => Promise<void>): Promise<void> {
    this.busyId.set(rec.id);
    this.actionError.set('');
    try {
      await run();
    } catch (err) {
      this.actionError.set((err as Error).message);
    } finally {
      this.busyId.set(undefined);
    }
  }
}
