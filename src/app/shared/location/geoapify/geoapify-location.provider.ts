import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Location } from '../location.model';
import { LocationProvider } from '../location.provider';

const AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';

interface GeoapifyResult {
  formatted?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
  place_id?: string;
}

interface GeoapifyResponse {
  results?: GeoapifyResult[];
}

@Injectable()
export class GeoapifyLocationProvider extends LocationProvider {
  private http = inject(HttpClient);

  search(query: string): Observable<Location[]> {
    return this.http
      .get<GeoapifyResponse>(AUTOCOMPLETE_URL, {
        params: {
          text: query,
          type: 'city',
          format: 'json',
          lang: 'en',
          limit: 5,
          apiKey: environment.geoapifyApiKey,
        },
      })
      .pipe(map((response) => this.toLocations(response.results ?? [])));
  }

  private toLocations(results: GeoapifyResult[]): Location[] {
    const seen = new Set<string>();
    const locations: Location[] = [];
    for (const result of results) {
      const location = this.toLocation(result);
      if (!location || seen.has(location.formatted)) continue;
      seen.add(location.formatted);
      locations.push(location);
    }
    return locations;
  }

  private toLocation(r: GeoapifyResult): Location | null {
    if (!r.formatted || typeof r.lat !== 'number' || typeof r.lon !== 'number') return null;

    const location: Location = { formatted: r.formatted, latitude: r.lat, longitude: r.lon };
    const city = r.city ?? r.town ?? r.village;
    if (city) location.city = city;
    if (r.state) location.region = r.state;
    if (r.country) location.country = r.country;
    if (r.country_code) location.countryCode = r.country_code.toUpperCase();
    if (r.place_id) location.placeId = r.place_id;
    return location;
  }
}
