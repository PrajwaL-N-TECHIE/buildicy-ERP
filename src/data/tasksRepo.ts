import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { cleanForFirestore } from '@/data/firestore';
import type { Task, TaskStatus } from '@/types';

const PATH = 'tasks';

export const tasksRepo = {
  watchAll(cb: (tasks: Task[]) => void, extra: QueryConstraint[] = []) {
    return onSnapshot(
      query(collection(db, PATH), ...extra),
      (snap) => {
        const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
        tasks.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
        cb(tasks);
      },
      (err) => {
        console.warn('[tasksRepo] watchAll listener notice:', err.message);
      }
    );
  },
  watchMine(uid: string, cb: (tasks: Task[]) => void) {
    return tasksRepo.watchAll(cb, [where('contributorId', '==', uid)]);
  },
  watchReviewable(cb: (tasks: Task[]) => void) {
    return tasksRepo.watchAll(cb, [
      where('status', 'in', ['Submitted', 'Pending Admin']),
    ]);
  },
  watchByStatus(status: TaskStatus, cb: (tasks: Task[]) => void) {
    return tasksRepo.watchAll(cb, [where('status', '==', status)]);
  },
  watchByProject(projectId: string, cb: (tasks: Task[]) => void) {
    return tasksRepo.watchAll(cb, [where('projectId', '==', projectId)]);
  },
  async create(input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const payload = cleanForFirestore({
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const ref = await addDoc(collection(db, PATH), payload);
    return ref.id;
  },
  async update(id: string, patch: Partial<Task>) {
    const payload = cleanForFirestore({
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, PATH, id), payload);
  },
  async updateStatus(id: string, status: TaskStatus) {
    await tasksRepo.update(id, { status });
  },
  async delete(id: string) {
    await deleteDoc(doc(db, PATH, id));
  },
};
