import { AuthService } from '@core/auth/auth.service';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getAuthErrorMessage } from '@core/auth/auth-errors';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  errorMessage = signal('');
  credentialError = signal(false);
  isSubmitting = signal(false);

  async onSubmit() {
    this.errorMessage.set('');
    this.credentialError.set(false);
    this.isSubmitting.set(true);

    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage.set(getAuthErrorMessage(err));
      const code = (err as { code?: string })?.code ?? '';
      this.credentialError.set(
        [
          'auth/invalid-credential',
          'auth/wrong-password',
          'auth/invalid-login-credentials',
        ].includes(code),
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
