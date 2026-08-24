import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { SystemAuditLog } from '@/types';

const PATH = 'audit_logs';

export const auditLogsRepo = {
  watchRecent(cb: (logs: SystemAuditLog[]) => void, max = 100) {
    return onSnapshot(
      query(collection(db, PATH), orderBy('timestamp', 'desc'), limit(max)),
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SystemAuditLog))),
      (err) => {
        console.warn('[auditLogsRepo] watchRecent listener notice:', err.message);
        cb([]);
      }
    );
  },
};
