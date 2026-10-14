import { Routes } from '@angular/router';
import { guestGuard } from '@core/auth/guest.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    data: {
      seo: {
        title: 'Log In | clockedin',
        description: 'Log in to your clockedin job search workspace.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'signup',
    data: {
      seo: {
        title: 'Create Your Account | clockedin',
        description: 'Create a clockedin account to organise your job search.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./signup/signup').then((m) => m.Signup),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    data: {
      seo: {
        title: 'Reset Your Password | clockedin',
        description: 'Reset access to your clockedin account.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPassword),
    canActivate: [guestGuard],
  },
  {
    path: 'verify-email',
    data: {
      seo: {
        title: 'Verify Your Email | clockedin',
        description: 'Verify the email address associated with your clockedin account.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'auth/error',
    data: {
      seo: {
        title: 'Authentication Error | clockedin',
        description: 'Resolve an issue signing in to clockedin.',
        robots: 'noindex, nofollow',
        canonical: false,
      },
    },
    loadComponent: () => import('./auth-error/auth-error').then((m) => m.AuthError),
  },
];
