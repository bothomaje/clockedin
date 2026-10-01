import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  styleUrl: './stat-card.scss',
  templateUrl: './stat-card.html',
})
export class StatCard {
  label = input.required<string>();
  value = input.required<string | number>();
}
