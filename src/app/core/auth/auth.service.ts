import { Service, signal } from '@angular/core';
import {
  applyActionCode,
  Auth,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getIdToken,
  onAuthStateChanged,
  onIdTokenChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { Observable, shareReplay } from 'rxjs';
import { firebaseAuth } from '../firebase/firebase';

@Service()
export class AuthService {
  private auth: Auth = firebaseAuth;

  currentUser$ = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(this.auth, subscriber);
  }).pipe(shareReplay(1));

  private emailVerifiedSignal = signal(false);
  readonly isEmailVerified = this.emailVerifiedSignal.asReadonly();

  constructor() {
    onIdTokenChanged(this.auth, (user) => {
      this.emailVerifiedSignal.set(user?.emailVerified === true);
    });
  }

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

  logOut() {
    return signOut(this.auth);
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

  currentUserSnapshot(): User | null {
    return this.auth.currentUser;
  }

  async refreshCurrentUser(): Promise<User | null> {
    const user = this.auth.currentUser;
    if (user) {
      await reload(user);

      if (user.emailVerified) await getIdToken(user, true);
      this.emailVerifiedSignal.set(user.emailVerified);
    }
    return user;
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
    await this.refreshCurrentUser();
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
