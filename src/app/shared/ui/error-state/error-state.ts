import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-state',
  styleUrl: './error-state.scss',
  templateUrl: './error-state.html',
})
export class ErrorState {
  title = input.required<string>();
  message = input<string>();
  details = input<string>();
}
