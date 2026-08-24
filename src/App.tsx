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
    if (newAuth.loading || legacyAuth.authLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden font-sans">
          {/* Ambient Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none animate-pulse"></div>
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center space-y-6 text-center px-4">
            {/* Animated Brand Badge */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-slate-900/90 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center justify-center">
                <img src="/logo.png" alt="Buildicy Logo" className="w-12 h-12 object-contain filter drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
              </div>
            </div>

            {/* Brand Title */}
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-purple-400">
                BUILDICY ERP
              </h1>
              <p className="text-xs font-bold text-purple-300/80 tracking-widest uppercase">
                Operations & Workforce Hub
              </p>
            </div>

            {/* Loading Indicator Pill */}
            <div className="flex items-center space-x-3 bg-slate-900/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-800 text-slate-300 text-xs font-semibold shadow-2xl shadow-purple-950/50">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-300">Authenticating Secure Workspace…</span>
            </div>
          </div>
        </div>
      );
    }
    if (!newAuth.currentUser && !legacyAuth.currentUser) {
      return <LoginView />;
    }
    return <DashboardView />;
  }

  if (!legacyAuth.currentUser) {
    return <LoginView />;
  }
  return <DashboardView />;
};

import { ToastProvider } from '@/context/ToastContext';

export function App() {
  return (
    <ToastProvider>
      <NewAuthProvider>
        <LegacyAuthProvider>
          <MainContent />
        </LegacyAuthProvider>
      </NewAuthProvider>
    </ToastProvider>
  );
}

export default App;