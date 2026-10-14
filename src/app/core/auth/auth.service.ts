import { inject, Service } from '@angular/core';
import {
  applyActionCode,
  Auth,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { firebaseAuth } from '../firebase/firebase';
import { AuthSession } from './auth-session';

@Service()
export class AuthService {
  private auth: Auth = firebaseAuth;
  private session = inject(AuthSession);

  async signUp(email: string, password: string, name?: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (name?.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() });
    }
    return credential;
  }

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  getAuthErrorMessage(err: unknown): string {
    const code = (err as { code?: string })?.code;

    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return "That email address doesn't look valid.";
      case 'auth/weak-password':
        return 'Password is too weak.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again in a few minutes.';
      case 'auth/invalid-action-code':
        return 'This verification link is invalid or has already been used. Please request a new one.';
      case 'auth/expired-action-code':
        return 'This verification link has expired. Please request a new one.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  private requireUser(): User {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No user is signed in.');
    return user;
  }

  async sendVerificationEmail(): Promise<void> {
    await sendEmailVerification(this.requireUser(), {
      url: `${window.location.origin}/onboarding`,
    });
  }

  async verifyEmail(actionCode: string): Promise<void> {
    await applyActionCode(this.auth, actionCode);
    await this.session.refreshCurrentUser();
  }

  async reauthenticate(currentPassword: string) {
    const user = this.auth.currentUser;
    if (!user?.email) throw new Error('No user is signed in.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.reauthenticate(currentPassword);
    await updatePassword(this.requireUser(), newPassword);
  }

  async deleteAuthAccount(): Promise<void> {
    await deleteUser(this.requireUser());
  }
}
