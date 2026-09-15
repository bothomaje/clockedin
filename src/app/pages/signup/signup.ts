import { UserService } from './../../services/user-service';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-signup',
  // styleUrl: './signup.scss',
  templateUrl: './signup.html',
})
export class Signup {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  isSubmitting = false;

  get passwordValid(): boolean {
    return (
      this.password.length >= 8 && /[A-Za-z]/.test(this.password) && /[0-9]/.test(this.password)
    );
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  async onSubmit() {
    this.errorMessage = '';

    if (!this.passwordValid) {
      this.errorMessage =
        'Password must be at least 8 characters and include a letter and a number.';
      return;
    }

    if (!this.passwordsMatch) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;

    try {
      const credential = await this.authService.signUp(this.email, this.password);
      await this.userService.createUserDoc(credential.user.uid, this.email);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage = this.authService.getAuthErrorMessage(err);
    } finally {
      this.isSubmitting = false;
    }
  }
}
