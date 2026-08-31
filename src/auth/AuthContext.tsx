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
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updatePassword,
  User as FbUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { buildUserProfileFromAuth } from '@/auth/firebaseAuth';
import type { RoleTier, User } from '@/types';

export const googleProvider = new GoogleAuthProvider();

export interface AuthContextValue {
  currentUser: User | null;
  fbUser: FbUser | null;
  loading: boolean;
  roleTier: RoleTier | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
      setLoading(true);
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
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
      } catch (err: any) {
        console.warn('[AuthContext auxiliary] Firebase Auth updatePassword notice:', err);
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      fbUser,
      loading,
      roleTier: currentUser?.roleTier ?? null,
      login,
      loginWithGoogle,
      logout,
      changePassword,
    }),
    [currentUser, fbUser, loading, login, loginWithGoogle, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      currentUser: null,
      fbUser: null,
      loading: false,
      roleTier: null,
      login: async () => {},
      loginWithGoogle: async () => {},
      logout: async () => {},
      changePassword: async () => {},
    };
  }
  return ctx;
}
