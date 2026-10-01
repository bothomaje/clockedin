import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  styleUrl: './page-header.scss',
  templateUrl: './page-header.html',
})
export class PageHeader {
  eyebrow = input<string>();
  title = input.required<string>();
  subtitle = input<string>();
  compact = input(false);
}
