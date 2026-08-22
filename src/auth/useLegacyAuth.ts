import { useAuth as useLegacyAuthContext } from '@/context/AuthContext';

/**
 * Bridge hook that re-exports the legacy AuthContext's auth methods for
 * LoginView when the VITE_USE_FIREBASE_AUTH flag is off.
 *
 * This file is the ONLY place in src/ that imports the legacy
 * AuthContext. Phase 8 deletes the legacy context entirely; the bridge
 * goes with it.
 */
export function useLegacyAuth() {
  const ctx = useLegacyAuthContext();
  return {
    loginWithCredentials: ctx.loginWithCredentials,
    loginAsUser: ctx.loginAsUser,
  };
}
