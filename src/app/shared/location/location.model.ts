export interface Location {
  formatted: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export function locationLabel(location: Location | null | undefined): string {
  if (!location) return '';
  if (!location.city) return location.formatted;
  const tail = location.country ?? location.countryCode;
  return tail ? `${location.city}, ${tail}` : location.city;
}

export function placeLabel(location?: Location | null, legacy?: string): string {
  return locationLabel(location) || legacy?.trim() || '';
}

export interface WorkLocated {
  location?: Location | null;
  legacyLocation?: string;
  workMode?: WorkMode | null;
}

export function workLocationLabel(item: WorkLocated): string {
  const mode = item.workMode ? WORK_MODE_LABELS[item.workMode] : '';
  const place = placeLabel(item.location, item.legacyLocation);
  if (place.toLowerCase() === mode.toLowerCase()) return mode;
  return [mode, place].filter(Boolean).join(' · ');
}

export function readStoredLocation(raw: unknown): { location?: Location; legacyLocation?: string } {
  if (typeof raw === 'string') return raw.trim() ? { legacyLocation: raw } : {};
  if (raw && typeof raw === 'object') return { location: raw as Location };
  return {};
}

export function toStoredLocation(item: WorkLocated): Location | string | null {
  if (item.workMode === 'remote') return null;
  return item.location ?? item.legacyLocation ?? null;
}

export function settleLegacy<T extends WorkLocated>(item: T): T {
  if (item.location === undefined && item.workMode !== 'remote') return item;
  const { legacyLocation: _legacy, ...rest } = item;
  return rest as T;
}

export function aiLocation(location?: Location | null, legacy?: string) {
  const label = placeLabel(location, legacy);
  if (!label) return undefined;
  return {
    label,
    city: location?.city,
    region: location?.region,
    countryCode: location?.countryCode,
  };
}
