import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Meeting } from '@/types';

const PATH = 'meetings';

export const meetingsRepo = {
  watchAll(cb: (meetings: Meeting[]) => void, extra: QueryConstraint[] = []) {
    return onSnapshot(
      query(collection(db, PATH), ...extra),
      (snap) => {
        const meetings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meeting));
        meetings.sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime());
        cb(meetings);
      },
      (err) => {
        console.warn('[meetingsRepo] watchAll listener notice:', err.message);
      }
    );
  },
  watchForUser(uid: string, cb: (meetings: Meeting[]) => void) {
    return meetingsRepo.watchAll(cb, [where('participantIds', 'array-contains', uid)]);
  },
  async create(input: Omit<Meeting, 'id' | 'createdAt'>) {
    const ref = await addDoc(collection(db, PATH), {
      ...input,
      createdAt: new Date().toISOString(),
    } as Meeting);
    return ref.id;
  },
  async delete(meetingId: string) {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, PATH, meetingId));
  },
};
