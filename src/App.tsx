import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginView } from '@/views/LoginView';
import { DashboardView } from '@/views/DashboardView';

const MainContent: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginView />;
  }

  return <DashboardView />;
};

export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
