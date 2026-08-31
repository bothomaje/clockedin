import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth-service';
import { AsyncPipe } from '@angular/common';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  selector: 'app-root',
  // styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  // protected readonly title = signal('clockedin');
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;

  async logOut() {
    await this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
