import React, { useEffect } from 'react';
import { AuthProvider as NewAuthProvider, useAuth as useNewAuth } from '@/auth/AuthContext';
import { AuthProvider as LegacyAuthProvider, useAuth as useLegacyAuth } from '@/context/AuthContext';
import { LoginView } from '@/views/LoginView';
import { DashboardView } from '@/views/DashboardView';
import { USE_FIREBASE_AUTH } from '@/auth/AuthContext';

const LS_TO_FS_MIGRATION_FLAG = 'erp_migrated_v2';

/**
 * One-shot migration from localStorage to Firestore.
 *
 * Runs once per browser (flag in LS). Pushes any LS-only state up to
 * Firestore on first load when USE_FIRESTORE_DATA is on. After Phase 8
 * the LS collections will be cleared automatically.
 */
function useLsToFsMigration(): void {
  useEffect(() => {
    if (USE_FIREBASE_AUTH !== true) return;
    if (localStorage.getItem(LS_TO_FS_MIGRATION_FLAG) === 'true') return;

    const collections = ['users', 'projects', 'tasks', 'meetings', 'audit_logs'];
    (async () => {
      try {
        // Dynamic import keeps the CF bundle small and avoids pulling
        // firebase/firestore on first paint.
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('@/firebase/config');
        const { USE_FIRESTORE_DATA } = await import('@/data/firestore');
        if (!USE_FIRESTORE_DATA) return;

        let migrated = 0;
        for (const c of collections) {
          const raw = localStorage.getItem(`erp_${c}`);
          if (!raw) continue;
          const docs = JSON.parse(raw) as Array<{ id: string }>;
          for (const d of docs) {
            await setDoc(doc(db, c, d.id), d as never, { merge: true });
            migrated++;
          }
        }
        localStorage.setItem(LS_TO_FS_MIGRATION_FLAG, 'true');
        console.info(`[migration] Pushed ${migrated} docs from LS to Firestore.`);
      } catch (err) {
        console.warn('[migration] Failed; will retry next load.', err);
      }
    })();
  }, []);
}

const MainContent: React.FC = () => {
  useLsToFsMigration();

  // Both hooks are always called (rules of hooks); the conditional logic
  // below decides which value to use based on the static flag.
  const newAuth = useNewAuth();
  const legacyAuth = useLegacyAuth();

  if (USE_FIREBASE_AUTH) {
    if (newAuth.loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm font-medium">
          Authenticating…
        </div>
      );
    }
    if (!newAuth.currentUser) {
      return <LoginView />;
    }
    return <DashboardView />;
  }

  if (!legacyAuth.currentUser) {
    return <LoginView />;
  }
  return <DashboardView />;
};

export function App() {
  return (
    <NewAuthProvider>
      <LegacyAuthProvider>
        <MainContent />
      </LegacyAuthProvider>
    </NewAuthProvider>
  );
}

export default App;