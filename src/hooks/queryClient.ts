import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

/**
 * QueryClient used app-wide. Defaults are tuned for an internal ERP:
 *   - staleTime: 30s — Firestore listeners will keep data fresh; we only
 *     fall back to cache when offline.
 *   - gcTime: 1 day — keep cached data alive for offline boot.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * IndexedDB-backed persister. Survives offline reloads.
 */
export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (await get<string>(key)) ?? null,
    setItem: async (key, value) => {
      await set(key, value);
    },
    removeItem: async (key) => {
      await del(key);
    },
  },
  key: 'buildicy-erp-cache',
  throttleTime: 1000,
});

/**
 * Standard 7-day cache lifetime for the IndexedDB persister.
 */
export const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
