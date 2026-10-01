import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-toast-banner',
  imports: [RouterLink],
  templateUrl: './toast-banner.html',
  styleUrl: './toast-banner.scss',
})
export class ToastBanner {
  toastService = inject(ToastService);
}
