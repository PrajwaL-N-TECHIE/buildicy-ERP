/**
 * Phase 4: Notification logging shim.
 *
 * The legacy SPA-side `addDoc(collection(db,'mail'), ...)` writes are
 * removed — Cloud Functions now own email delivery via Resend.
 *
 * The functions below remain exported so the legacy AuthContext (and
 * any direct callers) still compile. They persist to localStorage for
 * the in-app "Outbound Emails" inbox and that's it. Phase 7 retires
 * this file.
 */
import { getStoredNotifications, saveNotifications } from './config';
import type { MailNotification, Task, User, Project, Meeting } from '@/types';

function logNotification(notification: MailNotification): void {
  try {
    const existing = getStoredNotifications();
    const updated = [notification, ...existing];
    saveNotifications(updated);
  } catch (err) {
    console.error('Error logging notification:', err);
  }
}

export const sendTaskAssignmentEmail = async (
  task: Task,
  contributor: User,
  assigner: User,
  project: Project
): Promise<void> => {
  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Task Tracker ERP] New Task Assigned: ${project.name}`,
    bodyText: `Hello ${contributor.fullName},\n\nYou have been assigned a new task by ${assigner.fullName} in project "${project.name}".\n\nTask: ${task.description}\nDue: ${task.dueDate || 'N/A'}`,
    htmlText: `<p>Hello <strong>${contributor.fullName}</strong>,</p><p>You have been assigned a new task by <strong>${assigner.fullName}</strong> in project <strong>${project.name}</strong>.</p><p><strong>Description:</strong> ${task.description}</p>`,
    triggerEvent: 'TASK_ASSIGNED',
    createdAt: new Date().toISOString(),
  });
};

export const notifyTaskAssigned = sendTaskAssignmentEmail;

export const sendReviewStatusEmail = async (
  task: Task,
  contributor: User,
  reviewer: User,
  decision: 'approved' | 'sent_back',
  remark: string
): Promise<void> => {
  const isApproved = decision === 'approved';
  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Task Tracker ERP] Task Review Update: ${isApproved ? 'Approved' : 'Sent Back'}`,
    bodyText: `Hello ${contributor.fullName},\n\nYour task has been reviewed by ${reviewer.fullName}.\n\nDecision: ${decision.toUpperCase()}\nRemarks: ${remark || 'None'}`,
    htmlText: `<p>Decision: ${decision}</p><p>Remarks: ${remark || 'None'}</p>`,
    triggerEvent: isApproved ? 'REVIEW_APPROVED' : 'REVIEW_SENT_BACK',
    createdAt: new Date().toISOString(),
  });
};

export const notifyTaskSentBack = async (
  task: Task,
  contributor: User,
  actor: User,
  remark: string
): Promise<void> => {
  await sendReviewStatusEmail(task, contributor, actor, 'sent_back', remark);
};

export const notifyTaskApprovedByReviewer = async (
  task: Task,
  contributor: User,
  reviewer: User,
  _admins?: User[],
  _project?: Project
): Promise<void> => {
  await sendReviewStatusEmail(task, contributor, reviewer, 'approved', 'Reviewer approved.');
};

export const notifyTaskFinalApproved = async (
  task: Task,
  contributor: User,
  admin: User,
  remark?: string
): Promise<void> => {
  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Task Tracker ERP] Final Sign-Off: Task Approved`,
    bodyText: `Hello ${contributor.fullName},\n\nYour task "${task.description}" has been approved by ${admin.fullName}.\nRemarks: ${remark || 'None'}`,
    htmlText: `<p>Approved by ${admin.fullName}.</p>`,
    triggerEvent: 'FINAL_APPROVED',
    createdAt: new Date().toISOString(),
  });
};

export const notifyProjectDeadlineChanged = async (
  project: Project,
  members: User[],
  setBy: User,
  dueDate?: string,
  note?: string
): Promise<void> => {
  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: members.map((m) => m.email),
    subject: `[Task Tracker ERP] Project Deadline Updated: ${project.name}`,
    bodyText: `Hello Team,\n\nDeadline for ${project.name} updated to ${dueDate || project.deadline?.dueDate} by ${setBy.fullName}.`,
    htmlText: `<p>New deadline: ${dueDate || project.deadline?.dueDate}</p>`,
    triggerEvent: 'PROJECT_DEADLINE_UPDATED',
    createdAt: new Date().toISOString(),
  });
};

export const notifyMeetingScheduled = async (
  meeting: Meeting,
  participants: User[],
  organizer: User,
  project?: Project | null
): Promise<void> => {
  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: participants.map((p) => p.email),
    subject: `[Task Tracker ERP] Scheduled Meeting: ${meeting.title}`,
    bodyText: `Hello,\n\nMeeting: ${meeting.title}\nTime: ${meeting.scheduledAt}\nLocation: ${meeting.location}\nOrganizer: ${organizer.fullName}`,
    htmlText: `<p>${meeting.title} at ${meeting.scheduledAt}</p>`,
    triggerEvent: 'MEETING_SCHEDULED',
    createdAt: new Date().toISOString(),
  });
};

export const sendDailyOverdueDigestEmail = async (
  overdueTasks: Task[],
  founders: User[]
): Promise<void> => {
  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: founders.map((f) => f.email),
    subject: `[Task Tracker ERP] Daily Overdue Digest (${overdueTasks.length})`,
    bodyText: `${overdueTasks.length} overdue task(s) today.`,
    htmlText: `<p>${overdueTasks.length} overdue task(s).</p>`,
    triggerEvent: 'DAILY_OVERDUE_DIGEST',
    createdAt: new Date().toISOString(),
  });
};
