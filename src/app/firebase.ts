import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';
import { getAI, GoogleAIBackend } from 'firebase/ai';

export const firebaseApp = initializeApp(environment);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = initializeFirestore(firebaseApp, {}, 'default');

if (import.meta.env.DEV) {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env['VITE_FIREBASE_APPCHECK_DEBUG_TOKEN'] || true;
}

initializeAppCheck(firebaseApp, { provider: new ReCaptchaEnterpriseProvider('none') });
export const firebaseAi = getAI(firebaseApp, {
  backend: new GoogleAIBackend(),
  useLimitedUseAppCheckTokens: false,
});
