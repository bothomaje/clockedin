import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandFeature } from './auth-brand-content';

@Component({
  selector: 'app-auth-brand-panel',
  imports: [RouterLink],
  templateUrl: './auth-brand-panel.html',
  styleUrl: './auth-brand-panel.scss',
})
export class AuthBrandPanel {
  headline = input.required<string>();
  description = input.required<string>();
  features = input.required<BrandFeature[]>();
  variant = input<'auth' | 'wizard'>('auth');
  year = new Date().getFullYear();
}
