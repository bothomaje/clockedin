import { Component, inject, signal } from '@angular/core';
import { DISCOVERY_SOURCES } from '../../data/models/discovery-sources';
import { DiscoveryRepository } from '../../data/repositories/discovery.repository';

@Component({
  imports: [],
  selector: 'app-discovery-settings-panel',
  styleUrl: './discovery-settings-panel.scss',
  templateUrl: './discovery-settings-panel.html',
})
export class DiscoverySettingsPanel {
  private discovery = inject(DiscoveryRepository);

  readonly discoverySources = DISCOVERY_SOURCES;
  discoveryLoaded = signal(false);
  discoveryBusy = signal(false);
  discoveryError = signal('');
  discoveryEnabled = signal(false);
  selectedSources = signal<string[]>([]);

  constructor() {
    void this.loadDiscovery();
  }

  private async loadDiscovery() {
    try {
      const prefs = await this.discovery.loadPreferences();
      this.discoveryEnabled.set(prefs.enabled);
      this.selectedSources.set(prefs.sources);
      this.discoveryLoaded.set(true);
    } catch {
      this.discoveryError.set('Could not load job match settings.');
    }
  }

  async toggleSource(id: string, checked: boolean) {
    const previous = this.selectedSources();
    const next = checked ? [...previous, id] : previous.filter((s) => s !== id);
    if (!next.length) return;
    await this.saveDiscovery(
      () => this.discovery.setSources(next),
      () => {
        this.selectedSources.set(next);
      },
      () => this.selectedSources.set(previous),
    );
  }

  async setDiscoveryEnabled(enabled: boolean) {
    await this.saveDiscovery(
      () => this.discovery.setEnabled(enabled),
      () => {
        this.discoveryEnabled.set(enabled);
      },
    );
  }

  private async saveDiscovery(write: () => Promise<void>, apply: () => void, revert?: () => void) {
    this.discoveryError.set('');
    this.discoveryBusy.set(true);
    apply();
    try {
      await write();
    } catch {
      revert?.();
      this.discoveryError.set('Could not save. Try again.');
      if (!revert) void this.loadDiscovery();
    } finally {
      this.discoveryBusy.set(false);
    }
  }
}
