import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import App from './App';
import { queryClient, idbPersister, PERSIST_MAX_AGE_MS } from '@/hooks/queryClient';
import { initAppCheck } from '@/lib/appCheck';
import './index.css';

initAppCheck();

const rootEl = document.getElementById('root')!;
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbPersister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: 'buildicy-erp-v1',
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </React.StrictMode>
);
