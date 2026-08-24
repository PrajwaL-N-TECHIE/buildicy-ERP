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

export function buildUserProfileFromAuth(fbUser: FirebaseUser, roleTier: RoleTier): User {
  const email = fbUser.email || '';
  const displayName = fbUser.displayName || email.split('@')[0] || 'User';
  const parts = displayName.trim().split(' ');
  const firstName = parts[0] || 'User';
  const lastName = parts.slice(1).join(' ') || '';

  return {
    id: fbUser.uid,
    firstName,
    lastName,
    fullName: displayName,
    username: email || fbUser.uid,
    email,
    title: 'Team Member',
    roleTier,
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString(),
  };
}

const getDocWithTimeout = async (docRef: Parameters<typeof getDoc>[0], timeoutMs = 1500) => {
  return Promise.race([
    getDoc(docRef),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore request timed out')), timeoutMs)
    ),
  ]);
};

export const signInWithCredentials = async (email: string, password: string): Promise<AuthSession> => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const tokenResult = await cred.user.getIdTokenResult(true);
  const roleTier = (tokenResult.claims.roleTier as RoleTier) || 'contributor';

  let user: User;
  try {
    const userDoc = await getDocWithTimeout(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      user = { id: cred.user.uid, ...(userDoc.data() || {}) } as User;
    } else {
      user = buildUserProfileFromAuth(cred.user, roleTier);
    }
  } catch (err) {
    console.warn('[Auth] Firestore fetch warning, constructed auth profile:', err);
    user = buildUserProfileFromAuth(cred.user, roleTier);
  }

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

  const tokenResult = await fbUser.getIdTokenResult(true);
  const claims = tokenResult.claims as unknown as { roleTier?: RoleTier };
  const roleTier: RoleTier = claims.roleTier || 'contributor';

  let user: User | null = null;
  try {
    const userDoc = await getDocWithTimeout(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      user = { id: fbUser.uid, ...(userDoc.data() || {}) } as User;
    } else {
      user = buildUserProfileFromAuth(fbUser, roleTier);
    }
  } catch (err) {
    console.warn('[Auth] Firestore profile read warning:', err);
    user = buildUserProfileFromAuth(fbUser, roleTier);
  }

  return { roleTier, user };
};

export const subscribeToAuthChanges = (cb: (fbUser: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, cb);