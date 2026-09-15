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

  errorMessage = '';
  isSubmitting = false;

  async onSubmit() {
    this.errorMessage = '';
    this.isSubmitting = true;

    try {
      const credential = await this.authService.signUp(this.email, this.password);
      await this.userService.createUserDoc(credential.user.uid, this.email);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage = 'Could not create an account. Try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
