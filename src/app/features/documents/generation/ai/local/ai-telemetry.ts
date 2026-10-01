import { Service, signal } from '@angular/core';
import { AiGenerativeCapability } from '../ai-provider';

export interface AiTelemetryEvent {
  provider: string;
  execution: 'local' | 'cloud';
  task: AiGenerativeCapability;
  success: boolean;
  fallback: boolean;
  timestamp: number;
}

const MAX_EVENTS = 50;

@Service()
export class AiTelemetry {
  readonly events = signal<AiTelemetryEvent[]>([]);

  record(event: Omit<AiTelemetryEvent, 'timestamp'>): void {
    this.events.update((events) =>
      [...events, { ...event, timestamp: Date.now() }].slice(-MAX_EVENTS),
    );
  }

  get cloudRequestCount(): number {
    return this.events().filter((event) => event.execution === 'cloud').length;
  }

  get localGenerationCount(): number {
    return this.events().filter((event) => event.execution === 'local' && event.success).length;
  }

  get fallbackCount(): number {
    return this.events().filter((event) => event.fallback).length;
  }
}
