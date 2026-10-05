import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastBanner } from '../../ui/toast/toast-banner/toast-banner';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastBanner],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
})
export class AppShell {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  menuOpen = signal(false);

  displayName = computed(() => {
    const user = this.currentUser();
    return user?.displayName || user?.email?.split('@')[0] || '';
  });

  initials = computed(() =>
    this.displayName()
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );

  toggleMenu() {
    this.menuOpen.update((open) => !open);
  }

  onDocumentClick(event: MouseEvent) {
    const target = event.target as Element | null;
    if (!target?.closest('[aria-haspopup="menu"], .clk-header__menu')) this.menuOpen.set(false);
  }

  async logOut() {
    this.menuOpen.set(false);
    await this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
