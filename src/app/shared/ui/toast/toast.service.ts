import { Injectable, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  link: unknown[];
}
export interface Toast {
  message: string;
  action?: ToastAction;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private state = signal<Toast | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  toast = this.state.asReadonly();

  success(message: string, action?: ToastAction): void {
    clearTimeout(this.timer);
    this.state.set({ message, action });
    this.timer = setTimeout(() => this.dismiss(), 8000);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.state.set(null);
  }
}
