/**
 * Phase 9: App Check initialization.
 *
 * Wraps `initializeAppCheck` from firebase/app-check and only activates
 * when VITE_USE_APP_CHECK=true and a reCAPTCHA v3 site key is configured.
 *
 * Enable in Firebase Console → App Check → Register app → reCAPTCHA v3.
 * Then set VITE_USE_APP_CHECK=true and VITE_RECAPTCHA_SITE_KEY in .env.
 */
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { app } from '@/firebase/config';

export const USE_APP_CHECK: boolean =
  import.meta.env.VITE_USE_APP_CHECK === 'true' &&
  Boolean(import.meta.env.VITE_RECAPTCHA_SITE_KEY);

let initialised = false;

export function initAppCheck(): void {
  if (!USE_APP_CHECK || initialised) return;
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    initialised = true;
    console.log('[app-check] App Check initialised with reCAPTCHA v3.');
  } catch (err) {
    console.warn('[app-check] Failed to initialise:', err);
  }
}