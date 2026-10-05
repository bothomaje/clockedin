import { Service, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  link: unknown[];
}
export interface Toast {
  message: string;
  kind: 'success' | 'error';
  action?: ToastAction;
}

@Service()
export class ToastService {
  private state = signal<Toast | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  toast = this.state.asReadonly();

  success(message: string, action?: ToastAction): void {
    this.show({ message, kind: 'success', action }, 8000);
  }

  error(message: string): void {
    this.show({ message, kind: 'error' }, 12000);
  }

  private show(toast: Toast, ms: number): void {
    clearTimeout(this.timer);
    this.state.set(toast);
    this.timer = setTimeout(() => this.dismiss(), ms);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.state.set(null);
  }
}
