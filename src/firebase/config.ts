import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { User, Project, Task, Meeting, MailNotification, SystemAuditLog } from '@/types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "task-tracker-erp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "task-tracker-erp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "task-tracker-erp.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123def456"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);

export const SEED_USERS: User[] = [
  {
    id: 'user-1',
    firstName: 'Prajwal',
    lastName: 'N',
    fullName: 'Prajwal N',
    username: 'prajwal.admin',
    email: 'prajwal@company.com',
    title: 'Founder / CEO',
    roleTier: 'admin',
    projectIds: ['proj-1', 'proj-2', 'proj-3'],
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    dob: '1998-05-14',
    dateOfJoining: '2025-01-01',
    sourceOfHiring: 'Founder Direct',
    salary: 150000,
    phoneNumber: '+91 9876543210',
    personalEmail: 'prajwal.personal@gmail.com'
  },
  {
    id: 'user-2',
    firstName: 'Mayur',
    lastName: 'P',
    fullName: 'Mayur P',
    username: 'mayur.cto',
    email: 'mayur@company.com',
    title: 'Co Founder / CTO',
    roleTier: 'admin',
    projectIds: ['proj-1', 'proj-2', 'proj-3'],
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    dob: '1998-11-20',
    dateOfJoining: '2025-01-01',
    sourceOfHiring: 'Founder Direct',
    salary: 140000,
    phoneNumber: '+91 9876543211',
    personalEmail: 'mayur.personal@gmail.com'
  },
  {
    id: 'user-3',
    firstName: 'Mizbha Fathima',
    lastName: 'M',
    fullName: 'Mizbha Fathima M',
    username: 'mizbha.lead',
    email: 'mizbha@company.com',
    title: 'Creative Lead',
    roleTier: 'reviewer',
    projectIds: ['proj-1', 'proj-2'],
    active: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    dob: '2000-08-25',
    dateOfJoining: '2025-06-01',
    sourceOfHiring: 'LinkedIn Outreach',
    salary: 85000,
    phoneNumber: '+91 9876543212',
    personalEmail: 'mizbha.personal@gmail.com'
  },
  {
    id: 'user-4',
    firstName: 'Lathika',
    lastName: 'J',
    fullName: 'Lathika J',
    username: 'lathika.csl',
    email: 'lathika@company.com',
    title: 'CSL',
    roleTier: 'reviewer',
    projectIds: ['proj-2', 'proj-3'],
    active: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    dob: '2001-03-10',
    dateOfJoining: '2025-07-01',
    sourceOfHiring: 'Employee Referral',
    salary: 80000,
    phoneNumber: '+91 9876543213',
    personalEmail: 'lathika.personal@gmail.com'
  },
  {
    id: 'user-5',
    firstName: 'Shivasakthivel',
    lastName: 'L',
    fullName: 'Shivasakthivel L',
    username: 'shiva.ai',
    email: 'shiva@company.com',
    title: 'AI Engineer Intern',
    roleTier: 'contributor',
    projectIds: ['proj-1'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-09-02',
    dateOfJoining: '2026-01-10',
    sourceOfHiring: 'Campus Placement',
    salary: 35000,
    phoneNumber: '+91 9876543214',
    personalEmail: 'shiva.personal@gmail.com'
  },
  {
    id: 'user-6',
    firstName: 'Rajeshwari',
    lastName: 'M',
    fullName: 'Rajeshwari M',
    username: 'rajeshwari.sde',
    email: 'rajeshwari@company.com',
    title: 'SDE Intern',
    roleTier: 'contributor',
    projectIds: ['proj-1'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-12-18',
    dateOfJoining: '2026-01-10',
    sourceOfHiring: 'Campus Placement',
    salary: 30000,
    phoneNumber: '+91 9876543215',
    personalEmail: 'rajeshwari.personal@gmail.com'
  },
  {
    id: 'user-7',
    firstName: 'Mohamed Parishkhan',
    lastName: 'K',
    fullName: 'Mohamed Parishkhan K',
    username: 'parish.ai',
    email: 'parish@company.com',
    title: 'AI Engineer Intern',
    roleTier: 'contributor',
    projectIds: ['proj-2'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-04-05',
    dateOfJoining: '2026-01-15',
    sourceOfHiring: 'Direct Application',
    salary: 35000,
    phoneNumber: '+91 9876543216',
    personalEmail: 'parish.personal@gmail.com'
  },
  {
    id: 'user-8',
    firstName: 'Bhuvana Sree',
    lastName: 'S',
    fullName: 'Bhuvana Sree S',
    username: 'bhuvana.sde',
    email: 'bhuvana@company.com',
    title: 'SDE Intern',
    roleTier: 'contributor',
    projectIds: ['proj-2'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-08-28',
    dateOfJoining: '2026-01-15',
    sourceOfHiring: 'Campus Placement',
    salary: 30000,
    phoneNumber: '+91 9876543217',
    personalEmail: 'bhuvana.personal@gmail.com'
  },
  {
    id: 'user-9',
    firstName: 'Jamuna',
    lastName: 'Rani',
    fullName: 'Jamuna Rani',
    username: 'jamuna.sde',
    email: 'jamuna@company.com',
    title: 'SDE Intern',
    roleTier: 'contributor',
    projectIds: ['proj-3'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-10-12',
    dateOfJoining: '2026-01-20',
    sourceOfHiring: 'Employee Referral',
    salary: 30000,
    phoneNumber: '+91 9876543218',
    personalEmail: 'jamuna.personal@gmail.com'
  }
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Voice Agent',
    memberIds: ['user-1', 'user-2', 'user-3', 'user-5', 'user-6'],
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    deadline: {
      dueDate: '2026-09-15',
      note: 'Voice Bot V1 Production Launch',
      setBy: 'user-1',
      setAt: '2026-08-20T10:00:00.000Z'
    }
  },
  {
    id: 'proj-2',
    name: 'Markeee',
    memberIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-7', 'user-8'],
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    deadline: {
      dueDate: '2026-09-30',
      note: 'Q3 Brand & Outreach Campaign',
      setBy: 'user-3',
      setAt: '2025-09-15T09:30:00.000Z'
    }
  },
  {
    id: 'proj-3',
    name: 'Bizbrain',
    memberIds: ['user-1', 'user-2', 'user-4', 'user-9'],
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    deadline: {
      dueDate: '2026-10-15',
      note: 'ERP Analytics Module Delivery',
      setBy: 'user-2',
      setAt: '2026-08-19T14:15:00.000Z'
    }
  }
];

// Seed data uses 2025 dates — historical, so analytics/overdue views can
// still demonstrate "Overdue vs Approaching vs Normal" without conflicting
// with live runtime "today". Migrated away from the demo date 2026-08-21.
export const SEED_TASKS: Task[] = [
  {
    id: 'task-1',
    contributorId: 'user-5',
    assignedBy: null,
    projectId: 'proj-1',
    taskDate: '2025-09-15',
    dueDate: '2025-09-16', // Approaching due date
    description: 'Optimize WebRTC audio streaming latencies in Voice Agent handler',
    hours: 5,
    priority: 'high',
    status: 'In Progress',
    createdAt: '2025-09-15T08:00:00.000Z',
    updatedAt: '2025-09-15T09:00:00.000Z',
    activityLog: [
      { id: 'act-1', timestamp: '2025-09-15T08:00:00.000Z', actorName: 'Shiva', actorRole: 'contributor', action: 'Created task (Self-logged)' },
      { id: 'act-2', timestamp: '2025-09-15T09:00:00.000Z', actorName: 'Shiva', actorRole: 'contributor', action: 'Status changed to In Progress' }
    ]
  },
  {
    id: 'task-2',
    contributorId: 'user-7',
    assignedBy: 'user-3',
    projectId: 'proj-2',
    taskDate: '2026-08-20',
    dueDate: '2026-08-20', // Overdue / Due Today
    description: 'Design social media campaign banner variants & copy deck',
    hours: 6,
    priority: 'urgent',
    status: 'Submitted',
    createdAt: '2026-08-20T11:00:00.000Z',
    updatedAt: '2025-09-15T10:30:00.000Z',
    activityLog: [
      { id: 'act-3', timestamp: '2025-09-14T11:00:00.000Z', actorName: 'Mizbha Fathima', actorRole: 'reviewer', action: 'Assigned task to Parish' },
      { id: 'act-4', timestamp: '2025-09-15T10:30:00.000Z', actorName: 'Parish', actorRole: 'contributor', action: 'Submitted task for review' }
    ]
  },
  {
    id: 'task-3',
    contributorId: 'user-9',
    assignedBy: 'user-2',
    projectId: 'proj-3',
    taskDate: '2026-08-19',
    dueDate: '2025-09-15', // Due Today (historical demo seed)
    description: 'Draft API documentation for Bizbrain reporting endpoints',
    hours: 4,
    priority: 'high',
    status: 'Pending Admin',
    reviewerId: 'user-4',
    reviewerDecision: 'approved',
    reviewerRemark: 'Looks solid! Forwarding to founder approval.',
    reviewedAt: '2026-08-20T16:00:00.000Z',
    createdAt: '2026-08-19T09:00:00.000Z',
    updatedAt: '2026-08-20T16:00:00.000Z',
    activityLog: [
      { id: 'act-5', timestamp: '2026-08-19T09:00:00.000Z', actorName: 'Mayur P', actorRole: 'admin', action: 'Assigned task to Jamuna' },
      { id: 'act-6', timestamp: '2026-08-20T12:00:00.000Z', actorName: 'Jamuna', actorRole: 'contributor', action: 'Submitted task for review' },
      { id: 'act-7', timestamp: '2026-08-20T16:00:00.000Z', actorName: 'Lathika J', actorRole: 'reviewer', action: 'Reviewer Approved (Moved to Pending Admin)', note: 'Looks solid! Forwarding to founder approval.' }
    ]
  },
  {
    id: 'task-4',
    contributorId: 'user-6',
    assignedBy: 'user-1',
    projectId: 'proj-1',
    taskDate: '2026-08-18',
    dueDate: '2026-08-28', // Normal future date
    description: 'Integrate OpenAI Whisper STT fallback mechanism',
    hours: 8,
    priority: 'medium',
    status: 'Completed',
    reviewerId: 'user-3',
    reviewerDecision: 'approved',
    reviewerRemark: 'Verified STT fallbacks.',
    reviewedAt: '2026-08-19T11:00:00.000Z',
    adminId: 'user-1',
    adminDecision: 'approved',
    adminRemark: 'Great work! Milestone achieved.',
    approvedAt: '2026-08-20T14:00:00.000Z',
    createdAt: '2026-08-18T10:00:00.000Z',
    updatedAt: '2026-08-20T14:00:00.000Z',
    activityLog: [
      { id: 'act-8', timestamp: '2026-08-18T10:00:00.000Z', actorName: 'Prajwal N', actorRole: 'admin', action: 'Assigned task to Rajeshwari' },
      { id: 'act-9', timestamp: '2026-08-19T09:00:00.000Z', actorName: 'Rajeshwari', actorRole: 'contributor', action: 'Submitted task for review' },
      { id: 'act-10', timestamp: '2026-08-19T11:00:00.000Z', actorName: 'Mizbha Fathima', actorRole: 'reviewer', action: 'Reviewer Approved' },
      { id: 'act-11', timestamp: '2026-08-20T14:00:00.000Z', actorName: 'Prajwal N', actorRole: 'admin', action: 'Final Admin Approved (Completed)' }
    ]
  },
  {
    id: 'task-5',
    contributorId: 'user-5',
    assignedBy: 'user-3',
    projectId: 'proj-1',
    taskDate: '2026-08-19',
    dueDate: '2026-08-19', // Overdue
    description: 'Benchmark VAD model response latency on low-bandwidth connections',
    hours: 4,
    priority: 'low',
    status: 'In Progress',
    reviewerId: 'user-3',
    reviewerDecision: 'sent_back',
    reviewerRemark: 'Please include comparative benchmarks across 3G and 4G scenarios before resubmitting.',
    reviewedAt: '2026-08-20T12:00:00.000Z',
    createdAt: '2026-08-19T10:00:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
    activityLog: [
      { id: 'act-12', timestamp: '2026-08-19T10:00:00.000Z', actorName: 'Mizbha Fathima', actorRole: 'reviewer', action: 'Assigned task to Shiva' },
      { id: 'act-13', timestamp: '2026-08-20T10:00:00.000Z', actorName: 'Shiva', actorRole: 'contributor', action: 'Submitted task for review' },
      { id: 'act-14', timestamp: '2026-08-20T12:00:00.000Z', actorName: 'Mizbha Fathima', actorRole: 'reviewer', action: 'Sent Back task for revisions', note: 'Please include comparative benchmarks across 3G and 4G scenarios before resubmitting.' }
    ]
  }
];

export const SEED_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    title: 'Voice Agent Weekly Sprint & Architecture Review',
    projectId: 'proj-1',
    participantIds: ['user-1', 'user-3', 'user-5', 'user-6'],
    scheduledAt: '2026-08-25T10:00:00',
    location: 'Google Meet (meet.google.com/abc-defg-hij)',
    notes: 'Review audio buffer latency benchmarks and model accuracy.',
    createdBy: 'user-1',
    createdAt: '2025-09-15T09:00:00.000Z'
  },
  {
    id: 'meet-2',
    title: 'Markeee Creative Deck & Copy Review',
    projectId: 'proj-2',
    participantIds: ['user-2', 'user-3', 'user-4', 'user-7', 'user-8'],
    scheduledAt: '2026-08-26T14:30:00',
    location: 'Conference Room 2',
    notes: 'Finalize brand guidelines and copy approval deck.',
    createdBy: 'user-3',
    createdAt: '2025-09-15T11:00:00.000Z'
  }
];

export const SEED_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'audit-1',
    timestamp: '2025-09-15T10:30:00.000Z',
    actorId: 'user-1',
    actorName: 'Prajwal N',
    actorRole: 'admin',
    action: 'TASK_APPROVED',
    target: 'Task: Integrate OpenAI Whisper STT',
    details: 'Final Admin sign-off granted. Task status set to Completed.'
  },
  {
    id: 'audit-2',
    timestamp: '2025-09-15T09:30:00.000Z',
    actorId: 'user-3',
    actorName: 'Mizbha Fathima',
    actorRole: 'reviewer',
    action: 'DEADLINE_UPDATED',
    target: 'Project: Markeee',
    details: 'Project target deadline set to 2026-09-30 (Q3 Brand & Outreach Campaign).'
  },
  {
    id: 'audit-3',
    timestamp: '2025-09-15T09:00:00.000Z',
    actorId: 'user-1',
    actorName: 'Prajwal N',
    actorRole: 'admin',
    action: 'MEETING_SCHEDULED',
    target: 'Meeting: Voice Agent Weekly Sprint',
    details: 'Scheduled meeting with 4 participants. Notification emails dispatched.'
  }
];

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
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  return JSON.parse(data);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getStoredProjects = (): Project[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(SEED_PROJECTS));
    return SEED_PROJECTS;
  }
  return JSON.parse(data);
};

export const saveProjects = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
};

export const getStoredTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(SEED_TASKS));
    return SEED_TASKS;
  }
  return JSON.parse(data);
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const getStoredMeetings = (): Meeting[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(SEED_MEETINGS));
    return SEED_MEETINGS;
  }
  return JSON.parse(data);
};

export const saveMeetings = (meetings: Meeting[]) => {
  localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
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
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    return SEED_AUDIT_LOGS;
  }
  return JSON.parse(data);
};

export const saveAuditLogs = (logs: SystemAuditLog[]) => {
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
};
