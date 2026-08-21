import { collection, addDoc } from 'firebase/firestore';
import { db, getStoredNotifications, saveNotifications } from './config';
import { MailNotification, Task, User, Project, Meeting } from '@/types';

export const sendTaskAssignmentEmail = async (
  task: Task, 
  contributor: User, 
  assigner: User, 
  project: Project
) => {
  const notification: MailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Task Tracker ERP] New Task Assigned: ${project.name}`,
    bodyText: `Hello ${contributor.fullName},\n\nYou have been assigned a new task by ${assigner.fullName} in project "${project.name}".\n\nTask Description: ${task.description}\nHours: ${task.hours} hrs\nDue Date: ${task.dueDate || 'N/A'}\n\nPlease log into the ERP subdomain portal to review and start work.\n\nBest regards,\nTask Tracker ERP Platform`,
    htmlText: `<p>Hello <strong>${contributor.fullName}</strong>,</p><p>You have been assigned a new task by <strong>${assigner.fullName}</strong> in project <strong>${project.name}</strong>.</p><p><strong>Description:</strong> ${task.description}</p><p><strong>Hours:</strong> ${task.hours} hrs</p><p><strong>Due Date:</strong> ${task.dueDate || 'N/A'}</p>`,
    triggerEvent: 'TASK_ASSIGNED',
    createdAt: new Date().toISOString()
  };

  await logNotification(notification);
};

export const notifyTaskAssigned = sendTaskAssignmentEmail;

export const sendReviewStatusEmail = async (
  task: Task, 
  contributor: User, 
  reviewer: User, 
  decision: 'approved' | 'sent_back', 
  remark: string
) => {
  const isApproved = decision === 'approved';
  const notification: MailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Task Tracker ERP] Task Review Update: ${isApproved ? 'Approved (Moved to Admin)' : 'Sent Back for Revisions'}`,
    bodyText: `Hello ${contributor.fullName},\n\nYour task "${task.description}" has been reviewed by ${reviewer.fullName}.\n\nDecision: ${isApproved ? 'APPROVED (First Pass)' : 'SENT BACK FOR REVISIONS'}\nRemarks: ${remark || 'None'}\n\nPlease check the portal for details.`,
    htmlText: `<p>Hello <strong>${contributor.fullName}</strong>,</p><p>Your task "<em>${task.description}</em>" has been reviewed by <strong>${reviewer.fullName}</strong>.</p><p><strong>Decision:</strong> ${isApproved ? 'APPROVED (Moved to Admin Queue)' : 'SENT BACK FOR REVISIONS'}</p><p><strong>Remarks:</strong> ${remark || 'None'}</p>`,
    triggerEvent: isApproved ? 'REVIEW_APPROVED' : 'REVIEW_SENT_BACK',
    createdAt: new Date().toISOString()
  };

  await logNotification(notification);
};

export const notifyTaskSentBack = async (task: Task, contributor: User, actor: User, remark: string) => {
  await sendReviewStatusEmail(task, contributor, actor, 'sent_back', remark);
};

export const notifyTaskApprovedByReviewer = async (task: Task, contributor: User, reviewer: User, admins?: User[], project?: Project) => {
  await sendReviewStatusEmail(task, contributor, reviewer, 'approved', 'Reviewer approved task. Moved to Admin.');
};

export const notifyTaskFinalApproved = async (task: Task, contributor: User, admin: User, remark?: string) => {
  const notification: MailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Task Tracker ERP] Final Sign-Off Completed: Task Approved`,
    bodyText: `Hello ${contributor.fullName},\n\nYour task "${task.description}" has received final founder/admin approval.\n\nApproved By: ${admin.fullName}\nRemarks: ${remark || 'None'}\n\nTask status is now Completed.`,
    htmlText: `<p>Hello <strong>${contributor.fullName}</strong>,</p><p>Your task "<em>${task.description}</em>" has received final sign-off from <strong>${admin.fullName}</strong>.</p><p><strong>Status:</strong> Completed</p>`,
    triggerEvent: 'FINAL_APPROVED',
    createdAt: new Date().toISOString()
  };

  await logNotification(notification);
};

export const notifyProjectDeadlineChanged = async (project: Project, members: User[], setBy: User, dueDate?: string, note?: string) => {
  const notification: MailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: members.map(m => m.email),
    subject: `[Task Tracker ERP] Project Deadline Updated: ${project.name}`,
    bodyText: `Hello Team,\n\nThe deadline for project "${project.name}" has been updated by ${setBy.fullName}.\n\nNew Target Deadline: ${dueDate || project.deadline?.dueDate}\nNote: ${note || project.deadline?.note || 'None'}`,
    htmlText: `<p>Hello Team,</p><p>The target deadline for project <strong>${project.name}</strong> was updated by <strong>${setBy.fullName}</strong>.</p><p><strong>New Target Deadline:</strong> ${dueDate || project.deadline?.dueDate}</p>`,
    triggerEvent: 'PROJECT_DEADLINE_UPDATED',
    createdAt: new Date().toISOString()
  };

  await logNotification(notification);
};

export const notifyMeetingScheduled = async (meeting: Meeting, participants: User[], organizer: User, project?: Project | null) => {
  const notification: MailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: participants.map(p => p.email),
    subject: `[Task Tracker ERP] Scheduled Team Meeting: ${meeting.title}`,
    bodyText: `Hello,\n\nYou have been invited to a scheduled team meeting by ${organizer.fullName}.\n\nMeeting Title: ${meeting.title}\nProject: ${project?.name || 'General'}\nScheduled Time: ${meeting.scheduledAt}\nLocation: ${meeting.location}\nNotes: ${meeting.notes}`,
    htmlText: `<p>Hello,</p><p>You are invited to a team meeting organized by <strong>${organizer.fullName}</strong>.</p><p><strong>Title:</strong> ${meeting.title}</p><p><strong>Time:</strong> ${meeting.scheduledAt}</p><p><strong>Location:</strong> ${meeting.location}</p>`,
    triggerEvent: 'MEETING_SCHEDULED',
    createdAt: new Date().toISOString()
  };

  await logNotification(notification);
};

export const sendDailyOverdueDigestEmail = async (
  overdueTasks: Task[],
  founders: User[],
  projects: Project[],
  users: User[]
) => {
  const adminEmails = founders.map(f => f.email);
  const taskDetailsList = overdueTasks.map(t => {
    const contributor = users.find(u => u.id === t.contributorId);
    const project = projects.find(p => p.id === t.projectId);
    return `- ${t.description} (${project?.name}) | Assigned to: ${contributor?.fullName} | Due: ${t.dueDate}`;
  }).join('\n');

  const notification: MailNotification = {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: adminEmails,
    subject: `[Task Tracker ERP] Daily Overdue Digest (${overdueTasks.length} Overdue Tasks)`,
    bodyText: `Hello Founder/Admin,\n\nHere is your daily automated overdue task digest (${new Date().toLocaleDateString()}):\n\n${taskDetailsList}\n\nPlease follow up with assignees in the ERP portal.\n\nBest regards,\nTask Tracker Automated Digest`,
    htmlText: `<p>Hello Founder/Admin,</p><p>Here is your daily overdue task digest (${new Date().toLocaleDateString()}):</p><pre>${taskDetailsList}</pre>`,
    triggerEvent: 'DAILY_OVERDUE_DIGEST',
    createdAt: new Date().toISOString()
  };

  await logNotification(notification);
};

const logNotification = async (notification: MailNotification) => {
  try {
    const existing = getStoredNotifications();
    const updated = [notification, ...existing];
    saveNotifications(updated);

    try {
      await addDoc(collection(db, 'mail'), {
        to: notification.to,
        message: {
          subject: notification.subject,
          text: notification.bodyText,
          html: notification.htmlText
        },
        metadata: {
          triggerEvent: notification.triggerEvent,
          createdAt: notification.createdAt
        }
      });
    } catch (err) {
      console.log('Local storage notification fallback active.');
    }
  } catch (err) {
    console.error('Error logging notification:', err);
  }
};
