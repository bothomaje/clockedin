import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private authService = inject(AuthService);

  email = '';
  message = signal('');
  sentTo = signal('');
  errorMessage = signal('');
  isSubmitting = signal(false);

  async onSubmit() {
    this.message.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      await this.authService.sendPasswordReset(this.email);
      this.message.set('If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const fallbackMessage =
        code === 'auth/user-not-found'
          ? 'If an account exists for that email, a reset link has been sent.'
          : '';
      this.message.set(fallbackMessage);
      if (!fallbackMessage) {
        this.errorMessage.set(this.authService.getAuthErrorMessage(err));
      }
    } finally {
      if (this.message()) this.sentTo.set(this.email);
      this.isSubmitting.set(false);
    }
  }
}
