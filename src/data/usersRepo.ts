import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { cleanForFirestore } from '@/data/firestore';
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
    try {
      const cleaned = cleanForFirestore(user as Record<string, any>);
      await setDoc(doc(db, PATH, uid), cleaned, { merge: true });
    } catch (err: any) {
      console.warn('[usersRepo] upsert notice:', err?.message || err);
    }
  },
  async update(uid: string, patch: Partial<User>) {
    try {
      const cleaned = cleanForFirestore(patch as Record<string, any>);
      await updateDoc(doc(db, PATH, uid), cleaned);
    } catch (err: any) {
      console.warn('[usersRepo] update notice:', err?.message || err);
    }
  },
  async toggleActive(uid: string, active: boolean) {
    try {
      await updateDoc(doc(db, PATH, uid), { active });
    } catch (err: any) {
      console.warn('[usersRepo] toggleActive notice:', err?.message || err);
    }
  },
};
