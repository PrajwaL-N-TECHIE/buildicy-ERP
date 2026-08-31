import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { writeThrough } from '@/data/localStorageMirror';
import { User, Project, Task, Meeting, MailNotification, SystemAuditLog, LeaveRequest } from '@/types';

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


export const SEED_USERS: User[] = [
  {
    id: 'user-prajwal',
    firstName: 'Prajwal',
    lastName: 'N',
    fullName: 'Prajwal N',
    username: 'prajwalgenious@gmail.com',
    email: 'prajwalgenious@gmail.com',
    title: 'Founder / CEO',
    roleTier: 'admin',
    password: 'admin@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-mayur',
    firstName: 'Mayur',
    lastName: 'P',
    fullName: 'Mayur P',
    username: 'mayurkarthick2006@gmail.com',
    email: 'mayurkarthick2006@gmail.com',
    title: 'Co Founder / CTO',
    roleTier: 'admin',
    password: 'admin@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-mizbha',
    firstName: 'Mizbha Fathima',
    lastName: 'M',
    fullName: 'Mizbha Fathima M',
    username: 'mizbhaf@gmail.com',
    email: 'mizbhaf@gmail.com',
    title: 'Creative Lead',
    roleTier: 'reviewer',
    password: 'reviewer@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-lathika',
    firstName: 'Lathika',
    lastName: 'J',
    fullName: 'Lathika J',
    username: 'jlathika2005@gmail.com',
    email: 'jlathika2005@gmail.com',
    title: 'CSL',
    roleTier: 'reviewer',
    password: 'reviewer@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-rajeswari',
    firstName: 'Rajeswari',
    lastName: 'M',
    fullName: 'Rajeswari M',
    username: 'rajeswari.m.buildicy@gmail.com',
    email: 'rajeswari.m.buildicy@gmail.com',
    title: 'SDE Intern',
    roleTier: 'contributor',
    password: 'intern@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-mohamed',
    firstName: 'Mohamed Parishkhan',
    lastName: 'K',
    fullName: 'Mohamed Parishkhan K',
    username: 'mohamedparishkhan.k.buildicy@gmail.com',
    email: 'mohamedparishkhan.k.buildicy@gmail.com',
    title: 'AI Engineer Intern',
    roleTier: 'contributor',
    password: 'intern@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-shivasakthivel',
    firstName: 'Shivasakthivel',
    lastName: 'L',
    fullName: 'Shivasakthivel L',
    username: 'shivasakthivel.l.buildicy@gmail.com',
    email: 'shivasakthivel.l.buildicy@gmail.com',
    title: 'AI Engineer Intern',
    roleTier: 'contributor',
    password: 'intern@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-bhuvana',
    firstName: 'Bhuvana Sree',
    lastName: 'S',
    fullName: 'Bhuvana Sree S',
    username: 'bhuvanasree.s.buildicy@gmail.com',
    email: 'bhuvanasree.s.buildicy@gmail.com',
    title: 'SDE Intern',
    roleTier: 'contributor',
    password: 'intern@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-jamuna',
    firstName: 'Jamuna',
    lastName: 'Rani',
    fullName: 'Jamuna Rani',
    username: 'jamunarani.s.buildicy@gmail.com',
    email: 'jamunarani.s.buildicy@gmail.com',
    title: 'SDE Intern',
    roleTier: 'contributor',
    password: 'intern@123',
    dob: '2003-01-01',
    dateOfJoining: '2026-01-10',
    projectIds: [],
    active: true,
    createdAt: new Date().toISOString()
  }
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-voice-agent',
    name: 'Voice Agent AI Platform',
    memberIds: [
      'user-prajwal',
      'user-mayur',
      'user-rajeswari',
      'user-shivasakthivel',
      'user-mohamed',
      'user-bhuvana',
      'user-jamuna',
      'user-mizbha',
      'user-lathika'
    ],
    active: true,
    createdAt: new Date().toISOString(),
    deadline: {
      dueDate: '2026-09-15',
      note: 'AI Voice Engine Beta Release & Client Demo',
      setBy: 'user-prajwal',
      setAt: new Date().toISOString()
    }
  },
  {
    id: 'proj-buildicy-erp',
    name: 'Buildicy ERP & CRM Workspace',
    memberIds: [
      'user-prajwal',
      'user-mayur',
      'user-rajeswari',
      'user-mizbha',
      'user-lathika',
      'user-mohamed',
      'user-shivasakthivel',
      'user-bhuvana',
      'user-jamuna'
    ],
    active: true,
    createdAt: new Date().toISOString(),
    deadline: {
      dueDate: '2026-09-30',
      note: 'Operations, Attendance & Payroll Module Integration',
      setBy: 'user-prajwal',
      setAt: new Date().toISOString()
    }
  },
  {
    id: 'proj-markeee',
    name: 'Markeee Marketing Automation',
    memberIds: [
      'user-prajwal',
      'user-mizbha',
      'user-lathika',
      'user-rajeswari',
      'user-bhuvana'
    ],
    active: true,
    createdAt: new Date().toISOString(),
    deadline: {
      dueDate: '2026-10-10',
      note: 'Social Campaign Scheduler & Lead Generation Pipeline',
      setBy: 'user-prajwal',
      setAt: new Date().toISOString()
    }
  },
  {
    id: 'proj-bizbrain',
    name: 'Bizbrain AI Insights Hub',
    memberIds: [
      'user-prajwal',
      'user-mayur',
      'user-mohamed',
      'user-shivasakthivel',
      'user-jamuna',
      'user-rajeswari'
    ],
    active: true,
    createdAt: new Date().toISOString(),
    deadline: {
      dueDate: '2026-10-25',
      note: 'Enterprise Business Intelligence Analytics Pipeline',
      setBy: 'user-prajwal',
      setAt: new Date().toISOString()
    }
  }
];
export const SEED_TASKS: Task[] = [];
export const SEED_MEETINGS: Meeting[] = [];
export const SEED_AUDIT_LOGS: SystemAuditLog[] = [];

const STORAGE_KEYS = {
  USERS: 'erp_users',
  PROJECTS: 'erp_projects',
  TASKS: 'erp_tasks',
  MEETINGS: 'erp_meetings',
  NOTIFICATIONS: 'erp_notifications',
  AUDIT_LOGS: 'erp_audit_logs',
  LEAVE_REQUESTS: 'erp_leave_requests'
};

export const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    SEED_USERS.forEach((u) => writeThrough('users', u));
    return SEED_USERS;
  }
  try {
    const parsed: User[] = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_USERS;
  } catch {
    return SEED_USERS;
  }
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  users.forEach((u) => writeThrough('users', u));
};

export const getStoredProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!data) return [];
  try {
    const parsed: Project[] = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

export const INITIAL_NOTIFICATIONS_SEED: MailNotification[] = [];

export const getStoredNotifications = (): MailNotification[] => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (!data) {
    return [];
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

export const getStoredLeaveRequests = (): LeaveRequest[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveLeaveRequests = (requests: LeaveRequest[]) => {
  localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
  requests.forEach((r) => writeThrough('leave_requests', r));
};

