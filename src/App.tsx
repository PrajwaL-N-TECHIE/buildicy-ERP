import React from 'react';
import { AuthProvider as NewAuthProvider, useAuth as useNewAuth } from '@/auth/AuthContext';
import { AuthProvider as LegacyAuthProvider, useAuth as useLegacyAuth } from '@/context/AuthContext';
import { LoginView } from '@/views/LoginView';
import { DashboardView } from '@/views/DashboardView';
import { USE_FIREBASE_AUTH } from '@/auth/AuthContext';

const MainContent: React.FC = () => {
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
