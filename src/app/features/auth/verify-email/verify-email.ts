import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

type VerifyView = 'pending' | 'confirm' | 'success' | 'invalid';

const RESEND_COOLDOWN_SECONDS = 30;

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit, OnDestroy {
  private pollTimer?: ReturnType<typeof setInterval>;
  private cooldownTimer?: ReturnType<typeof setInterval>;
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  user = toSignal(this.authService.currentUser$, { initialValue: null });
  email = computed(() => this.user()?.email ?? '');

  view = signal<VerifyView>('pending');
  sending = signal(false);
  sent = signal(false);
  verifying = signal(false);
  cooldown = signal(0);
  errorMessage = signal('');

  private actionCode: string | null = null;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('oobCode');

    if (params.get('mode') === 'verifyEmail' && code) {
      this.actionCode = code;
      this.view.set('confirm');
      return;
    }

    void this.startPending();
  }

  ngOnDestroy(): void {
    clearInterval(this.pollTimer);
    clearInterval(this.cooldownTimer);
  }

  private async startPending(): Promise<void> {
    const user = await firstValueFrom(this.authService.currentUser$);

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    if (user.emailVerified) {
      this.router.navigate(['/onboarding']);
      return;
    }

    this.pollTimer = setInterval(() => void this.checkVerified(), 5000);
  }

  async verify(): Promise<void> {
    const code = this.actionCode;

    if (!code) {
      this.errorMessage.set('This verification link is missing its verification code.');
      this.view.set('invalid');
      return;
    }

    this.verifying.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.verifyEmail(code);
      this.view.set('success');
    } catch (err) {
      if (await this.isAlreadyVerified()) {
        this.view.set('success');
        return;
      }
      this.errorMessage.set(this.authService.getAuthErrorMessage(err));
      this.view.set('invalid');
    } finally {
      this.verifying.set(false);
    }
  }

  async resend(): Promise<void> {
    if (this.sending() || this.cooldown() > 0) return;

    this.sending.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.sendVerificationEmail();
      this.sent.set(true);
      this.startCooldown();
    } catch (err) {
      this.errorMessage.set(this.authService.getAuthErrorMessage(err));
    } finally {
      this.sending.set(false);
    }
  }

  private startCooldown(): void {
    clearInterval(this.cooldownTimer);
    this.cooldown.set(RESEND_COOLDOWN_SECONDS);
    this.cooldownTimer = setInterval(() => {
      this.cooldown.update((s) => s - 1);
      if (this.cooldown() <= 0) clearInterval(this.cooldownTimer);
    }, 1000);
  }

  private async isAlreadyVerified(): Promise<boolean> {
    try {
      const user = await this.authService.refreshCurrentUser();
      return user?.emailVerified === true;
    } catch {
      return false;
    }
  }

  async checkVerified(): Promise<void> {
    try {
      const user = await this.authService.refreshCurrentUser();
      if (user?.emailVerified) {
        clearInterval(this.pollTimer);
        this.router.navigate(['/onboarding']);
      }
    } catch {
      // transient network error: next poll retries
    }
  }

  async logOut(): Promise<void> {
    await this.authService.logOut();
    this.router.navigate(['/signup']);
  }

  skip(): void {
    clearInterval(this.pollTimer);
    this.router.navigate(['/onboarding']);
  }

  continueAfterVerification(): void {
    this.router.navigate([this.user() ? '/onboarding' : '/login']);
  }
}
