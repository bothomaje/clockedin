import { Service, signal } from '@angular/core';
import { firebaseAuth } from '@core/firebase/firebase';
import {
  Auth,
  getIdToken,
  onAuthStateChanged,
  onIdTokenChanged,
  reload,
  signOut,
  User,
} from 'firebase/auth';
import { Observable, shareReplay } from 'rxjs';

@Service()
export class AuthSession {
  private auth: Auth = firebaseAuth;

  private emailVerifiedSignal = signal(false);
  readonly isEmailVerified = this.emailVerifiedSignal.asReadonly();

  currentUser$ = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(this.auth, subscriber);
  }).pipe(shareReplay(1));

  constructor() {
    onIdTokenChanged(this.auth, (user) => {
      this.emailVerifiedSignal.set(user?.emailVerified === true);
    });
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

  logOut() {
    return signOut(this.auth);
  }
}
