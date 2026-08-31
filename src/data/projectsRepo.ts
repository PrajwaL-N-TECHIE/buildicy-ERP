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
import type { Project } from '@/types';

const PATH = 'projects';

export const projectsRepo = {
  watchAll(cb: (projects: Project[]) => void) {
    return onSnapshot(
      collection(db, PATH),
      (snap) => {
        const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
        projects.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        cb(projects);
      },
      (err) => {
        console.warn('[projectsRepo] watchAll listener notice:', err.message);
      }
    );
  },
  watchOne(projectId: string, cb: (project: Project | null) => void) {
    return onSnapshot(
      doc(db, PATH, projectId),
      (snap) => {
        cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null);
      },
      (err) => {
        console.warn('[projectsRepo] watchOne listener notice:', err.message);
        cb(null);
      }
    );
  },
  async upsert(projectId: string, project: Partial<Project>) {
    try {
      const cleaned = cleanForFirestore(project as Record<string, any>);
      await setDoc(doc(db, PATH, projectId), cleaned, { merge: true });
    } catch (err: any) {
      console.error('[projectsRepo] upsert error:', err?.message || err);
    }
  },
  async create(input: Omit<Project, 'id'>) {
    const cleaned = cleanForFirestore(input as Record<string, any>);
    const ref = await addDoc(collection(db, PATH), cleaned);
    return ref.id;
  },
  async update(projectId: string, patch: Partial<Project>) {
    const cleaned = cleanForFirestore(patch as Record<string, any>);
    await updateDoc(doc(db, PATH, projectId), cleaned);
  },
  async setDeadline(
    projectId: string,
    deadline: Project['deadline']
  ) {
    const cleaned = cleanForFirestore({ deadline });
    await updateDoc(doc(db, PATH, projectId), cleaned);
  },
  async delete(projectId: string) {
    await deleteDoc(doc(db, PATH, projectId));
  },
};
