import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User as FbUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { buildUserProfileFromAuth } from '@/auth/firebaseAuth';
import type { RoleTier, User } from '@/types';

export interface AuthContextValue {
  currentUser: User | null;
  fbUser: FbUser | null;
  loading: boolean;
  roleTier: RoleTier | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const USE_FIREBASE_AUTH: boolean =
  import.meta.env.VITE_USE_FIREBASE_AUTH === 'true';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!USE_FIREBASE_AUTH) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (next) => {
      setFbUser(next);
      if (!next) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await Promise.race([
          getDoc(doc(db, 'users', next.uid)),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 1500)
          ),
        ]);
        if (snap.exists()) {
          setCurrentUser({ id: next.uid, ...(snap.data() || {}) } as User);
        } else {
          const tokenResult = await next.getIdTokenResult();
          const claims = tokenResult.claims as unknown as { roleTier?: RoleTier };
          setCurrentUser(buildUserProfileFromAuth(next, claims.roleTier || 'contributor'));
        }
      } catch (err) {
        console.warn('[Auth] Firestore profile read warning, constructing profile:', err);
        try {
          const tokenResult = await next.getIdTokenResult();
          const claims = tokenResult.claims as unknown as { roleTier?: RoleTier };
          setCurrentUser(buildUserProfileFromAuth(next, claims.roleTier || 'contributor'));
        } catch {
          setCurrentUser(buildUserProfileFromAuth(next, 'contributor'));
        }
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    if (!auth.currentUser) {
      throw new Error('Not signed in.');
    }
    await updatePassword(auth.currentUser, newPassword);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      fbUser,
      loading,
      roleTier: currentUser?.roleTier ?? null,
      login,
      logout,
      changePassword,
    }),
    [currentUser, fbUser, loading, login, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
