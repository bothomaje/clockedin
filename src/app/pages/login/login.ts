import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  // styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  errorMessage = '';
  isSubmitting = false;

  async onSubmit() {
    this.errorMessage = '';
    this.isSubmitting = true;

    try {
      await this.authService.signIn(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage = 'Invalid email or password. Try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
