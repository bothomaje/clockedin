import { inject, Service } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User,
} from 'firebase/auth';
import { Observable, shareReplay } from 'rxjs';
import { firebaseAuth } from '../firebase';
import { UserService } from './user-service';

@Service()
export class AuthService {
  private auth: Auth = firebaseAuth;
  private userService = inject(UserService);

  currentUser$ = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(this.auth, subscriber);
  }).pipe(shareReplay(1));

  signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
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
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  currentUserSnapshot(): User | null {
    return this.auth.currentUser;
  }

  sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  sendVerificationEmail() {
    if (!this.auth.currentUser) throw new Error('No user is signed in.');
    return sendEmailVerification(this.auth.currentUser);
  }

  private async reauthenticate(currentPassword: string) {
    const user = this.auth.currentUser;
    if (!user?.email) throw new Error('No user is signed in.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.reauthenticate(currentPassword);
    await updatePassword(this.auth.currentUser!, newPassword);
  }

  async deleteAccount(currentPassword: string) {
    await this.reauthenticate(currentPassword);
    await this.userService.deleteAllUserData();
    await deleteUser(this.auth.currentUser!);
  }
}
