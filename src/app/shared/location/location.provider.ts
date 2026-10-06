import { Observable } from 'rxjs';
import { Location } from './location.model';

export abstract class LocationProvider {
  abstract search(query: string): Observable<Location[]>;
}
