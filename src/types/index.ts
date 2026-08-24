export type RoleTier = 'admin' | 'reviewer' | 'contributor';

export type TaskStatus = 
  | 'Not Started'
  | 'In Progress'
  | 'Submitted'
  | 'Pending Admin'
  | 'Completed';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: RoleTier;
  action: string;
  note?: string;
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  username?: string;
  email: string;
  password?: string; // Default passwords: admin@123, reviewer@123, intern@123
  title: string;
  roleTier: RoleTier;
  projectIds: string[];
  avatarUrl?: string | null; // User Profile Avatar Image URL
  active: boolean;
  createdAt: string;

  // Zoho People HR Fields
  dob?: string; // Date of Birth (YYYY-MM-DD)
  dateOfJoining?: string; // Date of Joining (YYYY-MM-DD)
  sourceOfHiring?: string; // e.g. LinkedIn, Campus Placement, Referral, Direct
  salary?: number; // Admin-only confidential salary
  phoneNumber?: string;
  personalEmail?: string;
  address?: string;
}

export interface ProjectDeadline {
  dueDate: string;
  note: string;
  setBy: string; // user id
  setAt: string;
}

export interface Project {
  id: string;
  name: string;
  memberIds: string[];
  active: boolean;
  createdAt: string;
  deadline?: ProjectDeadline | null;
}

export interface Task {
  id: string;
  contributorId: string; // who logs or who is assigned
  assignedBy: string | null; // admin/reviewer uid or null if self-logged
  projectId: string;
  taskDate: string;
  dueDate?: string | null;
  description: string;
  hours: number;
  priority: TaskPriority;
  status: TaskStatus;
  
  deliverableUrl?: string | null; // PR / Figma / Drive link
  checklist?: TaskChecklistItem[]; // Subtask checklist

  reviewerId?: string | null;
  reviewerDecision?: 'approved' | 'sent_back' | null;
  reviewerRemark?: string | null;
  reviewedAt?: string | null;

  adminId?: string | null;
  adminDecision?: 'approved' | 'sent_back' | null;
  adminRemark?: string | null;
  approvedAt?: string | null;

  createdAt: string;
  updatedAt: string;
  activityLog?: ActivityLogEntry[];
}

export interface Meeting {
  id: string;
  title: string;
  projectId?: string | null;
  participantIds: string[];
  scheduledAt: string;
  location: string; // room / call link
  notes: string;
  createdBy: string; // user id
  createdAt: string;
}

export interface MailNotification {
  id: string;
  to: string[];
  subject: string;
  bodyText: string;
  htmlText: string;
  triggerEvent: string;
  createdAt: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: RoleTier;
  action: string;
  target: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string | null; // Null if group channel
  channelId?: string | null; // e.g. '#general', '#voice-agent'
  text: string;
  timestamp: string;
  deleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalText?: string;
  readBy?: string[]; // Array of user IDs who have seen/read the message
}

export interface AttendanceSession {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  sessionStartTimestamp: string;
  sessionEndTimestamp?: string | null;
  durationHours?: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sessions: AttendanceSession[];
  totalWorkedHoursToday: number;
  status: 'checked_in' | 'checked_out';
}
