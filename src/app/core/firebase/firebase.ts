import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { getAI, GoogleAIBackend } from 'firebase/ai';

export const firebaseApp = initializeApp(environment);

if (!environment.production) {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.NG_APP_FIREBASE_APPCHECK_DEBUG_TOKEN ?? true;
}

initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaEnterpriseProvider(environment.recaptchaEnterpriseSiteKey),
  isTokenAutoRefreshEnabled: true,
});

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = initializeFirestore(firebaseApp, {}, 'default');
export const firebaseAi = getAI(firebaseApp, {
  backend: new GoogleAIBackend(),
  useLimitedUseAppCheckTokens: false,
});
