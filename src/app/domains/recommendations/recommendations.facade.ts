import { inject, Service } from '@angular/core';
import { TopMatchesState } from './data/state/top-matches-state';
import { Recommendation } from './data/models/recommendation';
import { DiscoveryRepository } from './data/repositories/discovery.repository';

@Service()
export class RecommendationsFacade {
  private matches = inject(TopMatchesState);
  private discovery = inject(DiscoveryRepository);

  readonly busyId = this.matches.busyId;
  readonly items = this.matches.items;
  readonly actionError = this.matches.actionError;
  readonly enabled = this.matches.enabled;
  readonly error = this.matches.error;

  load = () => this.matches.load();
  save = (rec: Recommendation) => this.matches.save(rec);
  loadPreferences = () => this.discovery.loadPreferences();
  setEnabled = (enabled: boolean) => this.discovery.setEnabled(enabled);
  setSources = (sources: string[]) => this.discovery.setSources(sources);
}
