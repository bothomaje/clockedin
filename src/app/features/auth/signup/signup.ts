import { ProfileState } from '../../profile/state/profile-state';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  imports: [FormsModule, RouterLink, NgTemplateOutlet],
  selector: 'app-signup',
  templateUrl: './signup.html',
})
export class Signup {
  private authService = inject(AuthService);
  private profileState = inject(ProfileState);
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
      const credential = await this.authService.signUp(this.email, this.password, this.name);
      await this.profileState.createProfile(credential.user.uid, this.email, this.name);
      await this.authService.sendVerificationEmail();
      this.router.navigate(['/verify-email']);
    } catch (err) {
      this.errorMessage.set(this.authService.getAuthErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
