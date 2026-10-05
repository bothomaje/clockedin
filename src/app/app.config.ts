import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideMarkdown } from 'ngx-markdown';
import { NgbDateAdapter, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap/datepicker';
import { DisplayDateParserFormatter, UtcDateAdapter } from './shared/ui/date-field/date-adapters';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideMarkdown(),
    { provide: NgbDateAdapter, useClass: UtcDateAdapter },
    { provide: NgbDateParserFormatter, useClass: DisplayDateParserFormatter },
  ],
};
