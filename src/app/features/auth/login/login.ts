import { AuthService } from '../../../core/auth/auth.service';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  errorMessage = signal('');
  isSubmitting = signal(false);

  async onSubmit() {
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage.set(this.authService.getAuthErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
