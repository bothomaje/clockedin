export interface DiscoverySource {
  id: string;
  label: string;
}

export interface DiscoveryPreferences {
  enabled: boolean;
  sources: string[];
}

export const DISCOVERY_SOURCES: readonly DiscoverySource[] = [{ id: 'adzuna', label: 'Adzuna' }];

const ALL_SOURCE_IDS = DISCOVERY_SOURCES.map((s) => s.id);

export function resolveSources(value: unknown): string[] {
  if (!Array.isArray(value)) return [...ALL_SOURCE_IDS];
  const valid = ALL_SOURCE_IDS.filter((id) => value.includes(id));
  return valid.length ? valid : [...ALL_SOURCE_IDS];
}
