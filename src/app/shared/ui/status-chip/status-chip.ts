import { Component, computed, input } from '@angular/core';

export type Tone = 'neutral' | 'signal' | 'success' | 'error';

const TONE_CLASS: Record<Tone, string> = {
  neutral: '',
  signal: 'clk-chip--signal',
  success: 'clk-chip--success',
  error: 'clk-chip--error',
};

@Component({
  selector: 'app-status-chip',
  templateUrl: './status-chip.html',
})
export class StatusChip {
  label = input.required<string>();
  tone = input<Tone>('neutral');
  class = computed(() => TONE_CLASS[this.tone()]);
}
