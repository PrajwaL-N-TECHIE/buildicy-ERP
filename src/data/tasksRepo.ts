import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Task, TaskStatus } from '@/types';

const PATH = 'tasks';

export const tasksRepo = {
  /**
   * Live-watch all tasks. Pass extra `QueryConstraint`s (where/orderBy/limit)
   * to narrow the subscription. RBAC enforces visibility server-side.
   */
  watchAll(cb: (tasks: Task[]) => void, extra: QueryConstraint[] = []) {
    return onSnapshot(
      query(collection(db, PATH), orderBy('updatedAt', 'desc'), ...extra),
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)))
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
    const ref = await addDoc(collection(db, PATH), {
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Task);
    return ref.id;
  },
  async update(id: string, patch: Partial<Task>) {
    await updateDoc(doc(db, PATH, id), {
      ...patch,
      updatedAt: new Date().toISOString(),
    } as Partial<Task>);
  },
  async updateStatus(id: string, status: TaskStatus) {
    await tasksRepo.update(id, { status });
  },
};
