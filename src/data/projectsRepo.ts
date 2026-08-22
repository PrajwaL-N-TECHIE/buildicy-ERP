import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Project } from '@/types';

const PATH = 'projects';

export const projectsRepo = {
  watchAll(cb: (projects: Project[]) => void) {
    return onSnapshot(
      query(collection(db, PATH), orderBy('createdAt', 'desc')),
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)))
    );
  },
  watchOne(projectId: string, cb: (project: Project | null) => void) {
    return onSnapshot(doc(db, PATH, projectId), (snap) => {
      cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Project) : null);
    });
  },
  async create(input: Omit<Project, 'id'>) {
    const ref = await addDoc(collection(db, PATH), input as Project);
    return ref.id;
  },
  async update(projectId: string, patch: Partial<Project>) {
    await updateDoc(doc(db, PATH, projectId), patch as Partial<Project>);
  },
  async setDeadline(
    projectId: string,
    deadline: Project['deadline']
  ) {
    await updateDoc(doc(db, PATH, projectId), { deadline });
  },
};
