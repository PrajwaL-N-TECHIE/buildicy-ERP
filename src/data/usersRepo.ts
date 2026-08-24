import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { User } from '@/types';

const PATH = 'users';

export const usersRepo = {
  watchAll(cb: (users: User[]) => void) {
    return onSnapshot(
      collection(db, PATH),
      (snap) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
      },
      (err) => {
        console.warn('[usersRepo] watchAll listener notice:', err.message);
        cb([]);
      }
    );
  },
  watchOne(uid: string, cb: (user: User | null) => void) {
    return onSnapshot(
      doc(db, PATH, uid),
      (snap) => {
        cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null);
      },
      (err) => {
        console.warn('[usersRepo] watchOne listener notice:', err.message);
        cb(null);
      }
    );
  },
  async upsert(uid: string, user: Partial<User>) {
    await setDoc(doc(db, PATH, uid), user as User, { merge: true });
  },
  async update(uid: string, patch: Partial<User>) {
    await updateDoc(doc(db, PATH, uid), patch as Partial<User>);
  },
  async toggleActive(uid: string, active: boolean) {
    await updateDoc(doc(db, PATH, uid), { active });
  },
};
