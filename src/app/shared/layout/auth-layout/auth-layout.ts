import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthBrandPanel } from '../auth-brand-panel/auth-brand-panel';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import {
  AUTH_DEFAULT_HEADLINE,
  AUTH_DESCRIPTION,
  AUTH_FEATURES,
  AUTH_HEADLINES,
} from '../auth-brand-panel/auth-brand-content';

@Component({
  imports: [RouterOutlet, AuthBrandPanel],
  selector: 'app-auth-layout',
  styleUrl: './auth-layout.scss',
  templateUrl: './auth-layout.html',
})
export class AuthLayout {
  private router = inject(Router);

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  headline = computed(
    () =>
      AUTH_HEADLINES.find((h) => this.url().startsWith(h.prefix))?.headline ??
      AUTH_DEFAULT_HEADLINE,
  );
  description = AUTH_DESCRIPTION;
  features = AUTH_FEATURES;
}
