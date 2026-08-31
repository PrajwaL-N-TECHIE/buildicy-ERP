import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { cleanForFirestore } from '@/data/firestore';
import type { LeaveRequest } from '@/types';

const PATH = 'leave_requests';

export const leaveRequestsRepo = {
  watchAll(cb: (requests: LeaveRequest[]) => void) {
    return onSnapshot(
      collection(db, PATH),
      (snap) => {
        const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaveRequest));
        requests.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        cb(requests);
      },
      (err) => {
        console.warn('[leaveRequestsRepo] watchAll listener notice:', err.message);
      }
    );
  },
  async upsert(requestId: string, request: Partial<LeaveRequest>) {
    try {
      const cleaned = cleanForFirestore(request as Record<string, any>);
      await setDoc(doc(db, PATH, requestId), cleaned, { merge: true });
    } catch (err: any) {
      console.error('[leaveRequestsRepo] upsert error:', err?.message || err);
    }
  },
  async create(input: Omit<LeaveRequest, 'id'>) {
    const cleaned = cleanForFirestore(input as Record<string, any>);
    const ref = await addDoc(collection(db, PATH), cleaned);
    return ref.id;
  },
  async update(requestId: string, patch: Partial<LeaveRequest>) {
    const cleaned = cleanForFirestore(patch as Record<string, any>);
    await updateDoc(doc(db, PATH, requestId), cleaned);
  },
  async delete(requestId: string) {
    await deleteDoc(doc(db, PATH, requestId));
  },
};
