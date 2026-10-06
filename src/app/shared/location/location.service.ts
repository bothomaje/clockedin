import { Service, inject } from '@angular/core';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { Location } from './location.model';
import { LocationProvider } from './location.provider';

export interface LocationSearchState {
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error';
  results: Location[];
}

const IDLE: LocationSearchState = { status: 'idle', results: [] };
const LOADING: LocationSearchState = { status: 'loading', results: [] };
const EMPTY: LocationSearchState = { status: 'empty', results: [] };
const ERROR: LocationSearchState = { status: 'error', results: [] };

export const MIN_QUERY_LENGTH = 3;
export const DEBOUNCE_MS = 300;

@Service()
export class LocationService {
  private provider = inject(LocationProvider);

  suggestions(query$: Observable<string>): Observable<LocationSearchState> {
    return query$.pipe(
      map((query) => query.trim()),
      debounceTime(DEBOUNCE_MS),
      distinctUntilChanged(),
      switchMap((query) =>
        query.length < MIN_QUERY_LENGTH
          ? of(IDLE)
          : this.provider.search(query).pipe(
              map((results): LocationSearchState =>
                results.length ? { status: 'ready', results } : EMPTY,
              ),
              catchError(() => of(ERROR)),
              startWith(LOADING),
            ),
      ),
    );
  }
}
