import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { writeThrough } from '@/data/localStorageMirror';
import { User, Project, Task, Meeting, MailNotification, SystemAuditLog } from '@/types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export { app };
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, 'default');


export const SEED_USERS: User[] = [];
export const SEED_PROJECTS: Project[] = [];
export const SEED_TASKS: Task[] = [];
export const SEED_MEETINGS: Meeting[] = [];
export const SEED_AUDIT_LOGS: SystemAuditLog[] = [];

const STORAGE_KEYS = {
  USERS: 'erp_users',
  PROJECTS: 'erp_projects',
  TASKS: 'erp_tasks',
  MEETINGS: 'erp_meetings',
  NOTIFICATIONS: 'erp_notifications',
  AUDIT_LOGS: 'erp_audit_logs'
};

export const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  users.forEach((u) => writeThrough('users', u));
};

export const getStoredProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return data ? JSON.parse(data) : [];
};

export const saveProjects = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  projects.forEach((p) => writeThrough('projects', p));
};

export const getStoredTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  tasks.forEach((t) => writeThrough('tasks', t));
};

export const getStoredMeetings = (): Meeting[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
  return data ? JSON.parse(data) : [];
};

export const saveMeetings = (meetings: Meeting[]) => {
  localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  meetings.forEach((m) => writeThrough('meetings', m));
};

export const getStoredNotifications = (): MailNotification[] => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

export const saveNotifications = (notifications: MailNotification[]) => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const getStoredAuditLogs = (): SystemAuditLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  return data ? JSON.parse(data) : [];
};

export const saveAuditLogs = (logs: SystemAuditLog[]) => {
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  // Phase 8: audit logs are server-only. SPA writes are queued for the
  // Phase 8 callable to pick up; for now we still write LS so the
  // in-app audit tab keeps showing entries.
};
