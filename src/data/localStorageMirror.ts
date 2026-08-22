/**
 * Dual-write helper used during Phase 2-4.
 *
 * Writes the doc to localStorage first (instant UI feedback), then
 * writes to Firestore in the background. If Firestore fails (offline,
 * rules denial), the localStorage copy remains and will be retried
 * on the next call.
 *
 * Phase 7 retires this module entirely.
 */
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { USE_FIRESTORE_DATA } from './firestore';

type Collections = 'users' | 'projects' | 'tasks' | 'meetings' | 'audit_logs';

const LS_KEY: Record<Collections, string> = {
  users: 'erp_users',
  projects: 'erp_projects',
  tasks: 'erp_tasks',
  meetings: 'erp_meetings',
  audit_logs: 'erp_audit_logs',
};

export function writeThrough<T extends { id: string }>(
  collection: Collections,
  entity: T
): void {
  // 1) localStorage first (always wins for snappy UX)
  try {
    const raw = localStorage.getItem(LS_KEY[collection]);
    const list: T[] = raw ? JSON.parse(raw) : [];
    const next = list.filter((x) => x.id !== entity.id).concat(entity);
    localStorage.setItem(LS_KEY[collection], JSON.stringify(next));
  } catch (err) {
    console.warn(`[writeThrough] LS write failed for ${collection}`, err);
  }

  // 2) Firestore in the background (best-effort during Phase 2-4).
  if (!USE_FIRESTORE_DATA) return;
  setDoc(doc(db, collection, entity.id), entity as never, { merge: true }).catch((err) => {
    console.warn(`[writeThrough] FS write failed for ${collection}/${entity.id}`, err);
  });
}

export function deleteThrough(collection: Collections, id: string): void {
  try {
    const raw = localStorage.getItem(LS_KEY[collection]);
    if (!raw) return;
    const list = JSON.parse(raw) as { id: string }[];
    localStorage.setItem(
      LS_KEY[collection],
      JSON.stringify(list.filter((x) => x.id !== id))
    );
  } catch (err) {
    console.warn(`[deleteThrough] LS delete failed for ${collection}`, err);
  }
}
