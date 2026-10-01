import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-error',
  imports: [RouterLink],
  templateUrl: './auth-error.html',
})
export class AuthError {
  private route = inject(ActivatedRoute);

  message =
    this.route.snapshot.queryParamMap.get('message') ??
    'Something went wrong while signing you in.';
}
