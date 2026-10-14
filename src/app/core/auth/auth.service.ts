import { inject, Service } from '@angular/core';
import {
  applyActionCode,
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
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

  sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  async verifyEmail(actionCode: string): Promise<void> {
    await applyActionCode(this.auth, actionCode);
    await this.session.refreshCurrentUser();
  }
}
