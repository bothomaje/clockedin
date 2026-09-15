import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';
  message = '';
  errorMessage = '';
  isSubmitting = false;

  async onSubmit() {
    this.message = '';
    this.errorMessage = '';
    this.isSubmitting = true;

    try {
      await this.authService.sendPasswordReset(this.email);
      this.message = 'If an account exists for that email, a reset link has been sent.';
    } catch (err) {
      const code = (err as { code?: string })?.code;
      this.message =
        code === 'auth/user-not-found'
          ? 'If an account exists for that email, a reset link has been sent.'
          : '';
      if (!this.message) {
        this.errorMessage = this.authService.getAuthErrorMessage(err);
      }
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }
}
