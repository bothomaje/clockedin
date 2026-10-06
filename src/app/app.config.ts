import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideMarkdown } from 'ngx-markdown';
import { NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap/datepicker';
import { DisplayDateParserFormatter, UtcDateAdapter } from './shared/ui/date-field/date-adapters';
import { LocationProvider } from './shared/location/location.provider';
import { GeoapifyLocationProvider } from './shared/location/geoapify/geoapify-location.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideMarkdown(),
    { provide: NgbDateAdapter, useClass: UtcDateAdapter },
    { provide: NgbDateParserFormatter, useClass: DisplayDateParserFormatter },
    { provide: LocationProvider, useClass: GeoapifyLocationProvider },
  ],
};
