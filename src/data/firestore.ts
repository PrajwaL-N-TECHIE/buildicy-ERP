import {
  collection,
  doc,
  DocumentData,
  FirestoreDataConverter,
  WithFieldValue,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export const USE_FIRESTORE_DATA: boolean =
  import.meta.env.VITE_USE_FIRESTORE_DATA === 'true';

/**
 * Generic typed Firestore converter. Adds `id` from the doc ref and
 * strips server timestamps back to ISO strings.
 */
export function withId<T extends { id: string }>(
  snap: { id: string; data(): DocumentData | undefined }
): T {
  const data = snap.data() ?? {};
  return { ...(data as object), id: snap.id } as T;
}

export function snapToArray<T extends { id: string }>(
  docs: { id: string; data(): DocumentData | undefined }[]
): T[] {
  return docs.map((d) => withId<T>(d));
}

/**
 * Convenience: serverTimestamp() → ISO string. Used when reading
 * documents that were created via Cloud Functions with server timestamps.
 */
export function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  // Firestore Timestamp has toDate(); falls through if unavailable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybe = ts as any;
  if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString();
  if (typeof maybe._seconds === 'number') {
    return new Date(maybe._seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Standard typed FirestoreDataConverter used by the repos. Maps Date to
 * Timestamp and back automatically.
 */
export function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(value: WithFieldValue<T>): DocumentData {
      const { id: _id, ...rest } = value as T;
      return rest as DocumentData;
    },
    fromFirestore(snap, options): T {
      const data = snap.data(options);
      return { ...(data as object), id: snap.id } as T;
    },
  };
}

/**
 * Build a doc ref at /{path}/{id} and return it.
 */
export function docAt<T = unknown>(path: string, id: string) {
  return doc(db, path, id) as ReturnType<typeof doc> & { __type?: T };
}
