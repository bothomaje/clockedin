import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);

if (!environment.production && environment.useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
}

export const firestore = getFirestore(firebaseApp);

if (!environment.production && environment.useEmulators) {
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
}
