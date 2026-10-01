import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  styleUrl: './empty-state.scss',
  templateUrl: './empty-state.html',
})
export class EmptyState {
  title = input.required<string>();
  description = input<string>();
  hint = input<string>();
  compact = input(false);
}
