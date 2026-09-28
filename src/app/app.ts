import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  async logOut() {
    await this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
