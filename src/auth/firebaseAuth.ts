import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { User, RoleTier } from '@/types';

export interface AuthSession {
  fbUser: FirebaseUser;
  user: User;
  roleTier: RoleTier;
}

export const signInWithCredentials = async (email: string, password: string): Promise<AuthSession> => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const tokenResult = await cred.user.getIdTokenResult(true);
  const roleTier = (tokenResult.claims.roleTier as RoleTier) || 'contributor';

  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (!userDoc.exists()) {
    throw new Error('User profile not found in Firestore.');
  }
  const user = { id: cred.user.uid, ...userDoc.data() } as User;
  return { fbUser: cred.user, user, roleTier };
};

export const signOutCurrent = async (): Promise<void> => {
  await signOut(auth);
  localStorage.removeItem('erp_active_user_id');
  localStorage.removeItem('erp_theme');
};

export const refreshTokenAndClaims = async (): Promise<{ roleTier: RoleTier; user: User | null }> => {
  const fbUser = auth.currentUser;
  if (!fbUser) return { roleTier: 'contributor', user: null };

  // user.getIdTokenResult() returns a parsed token + claims; forceRefresh true to pick up claim changes.
  const tokenResult = await fbUser.getIdTokenResult(true);
  // firebase v10 typings treat claims as a record but the inferred type can
  // collapse to string under strict mode; cast through unknown to satisfy TS.
  const claims = tokenResult.claims as unknown as { roleTier?: RoleTier };
  const roleTier: RoleTier = claims.roleTier || 'contributor';

  const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
  const user = userDoc.exists() ? ({ id: fbUser.uid, ...userDoc.data() } as User) : null;

  return { roleTier, user };
};

export const subscribeToAuthChanges = (cb: (fbUser: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, cb);