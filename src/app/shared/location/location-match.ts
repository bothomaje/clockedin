import { Location, WorkMode } from './location.model';

export type LocationRelation =
  'remote-role' | 'same-city' | 'same-region' | 'same-country' | 'different-country' | 'unknown';

export interface LocationMatch {
  relation: LocationRelation;
  approxDistanceKm?: number;
}

const SAME_CITY_KM = 30;
const norm = (v?: string) => v?.trim().toLowerCase() ?? '';

function haversineKm(a: Location, b: Location): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function compareLocations(
  candidate?: Location | null,
  job?: Location | null,
  jobWorkMode?: WorkMode | null,
): LocationMatch {
  if (jobWorkMode === 'remote') return { relation: 'remote-role' };
  if (!candidate || !job) return { relation: 'unknown' };

  const km = haversineKm(candidate, job);
  const approxDistanceKm = Math.round(km / 10) * 10;
  const sameCountry = !!candidate.countryCode && candidate.countryCode === job.countryCode;
  const sameCity = sameCountry && !!norm(candidate.city) && norm(candidate.city) === norm(job.city);

  if (sameCity || km <= SAME_CITY_KM) return { relation: 'same-city', approxDistanceKm };
  if (sameCountry && !!norm(candidate.region) && norm(candidate.region) === norm(job.region))
    return { relation: 'same-region', approxDistanceKm };
  if (sameCountry) return { relation: 'same-country', approxDistanceKm };
  if (candidate.countryCode && job.countryCode)
    return { relation: 'different-country', approxDistanceKm };
  return { relation: 'unknown', approxDistanceKm };
}
