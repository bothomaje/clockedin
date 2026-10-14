import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ProfileFacade } from '@domains/profile';
import { getAuthErrorMessage } from '@core/auth/auth-errors';
import { AuthSession } from '@core/auth/auth-session';

@Component({
  imports: [FormsModule, RouterLink, NgTemplateOutlet],
  selector: 'app-signup',
  templateUrl: './signup.html',
})
export class Signup {
  private auth = inject(AuthService);
  private session = inject(AuthSession);
  private profile = inject(ProfileFacade);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  errorMessage = signal('');
  isSubmitting = signal(false);

  get passwordValid(): boolean {
    return (
      this.password.length >= 8 && /[A-Za-z]/.test(this.password) && /[0-9]/.test(this.password)
    );
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  async onSubmit() {
    this.errorMessage.set('');

    if (!this.passwordValid) {
      this.errorMessage.set(
        'Password must be at least 8 characters and include a letter and a number.',
      );
      return;
    }

    if (!this.passwordsMatch) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const credential = await this.auth.signUp(this.email, this.password, this.name);
      await this.profile.createProfile(credential.user.uid, this.email, this.name);
      await this.session.sendVerificationEmail();
      this.router.navigate(['/verify-email']);
    } catch (err) {
      this.errorMessage.set(getAuthErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
