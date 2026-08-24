/**
 * Buildicy ERP Notification & Live Resend Email Engine.
 *
 * Persists notifications to localStorage for the in-app "Outbound Emails" log
 * AND dispatches direct HTTP requests to the Resend API using VITE_RESEND_API_KEY.
 */
import { getStoredNotifications, saveNotifications } from './config';
import type { MailNotification, Task, User, Project, Meeting } from '@/types';

function formatUserRole(user: User): string {
  if (user.title && user.title.trim() !== '') {
    return `${user.fullName} (${user.title})`;
  }
  const defaultTitle = user.roleTier === 'admin' 
    ? 'Founder & CEO' 
    : user.roleTier === 'reviewer' 
    ? 'CSL / Lead' 
    : '';
  return defaultTitle ? `${user.fullName} (${defaultTitle})` : user.fullName;
}

function buildEmailTemplate(title: string, badgeText: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #7c3aed; padding: 24px; color: #ffffff; text-align: left; }
        .badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .header-title { font-size: 20px; font-weight: 800; margin: 0; color: #ffffff; }
        .body { padding: 28px; font-size: 14px; line-height: 1.6; color: #334155; }
        .detail-box { background: #f1f5f9; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #1e293b; }
        .detail-item { margin-bottom: 8px; }
        .detail-item:last-child { margin-bottom: 0; }
        .label { font-weight: 700; color: #475569; }
        .btn { display: inline-block; background: #7c3aed; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; margin-top: 16px; text-align: center; }
        .footer { background: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">${badgeText}</div>
          <h1 class="header-title">${title}</h1>
        </div>
        <div class="body">
          ${contentHtml}
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://erp.buildicy.com" class="btn" target="_blank">Open Buildicy ERP Operations Hub →</a>
          </div>
        </div>
        <div class="footer">
          Buildicy ERP Platform &bull; Real-time Operations & Workforce Analytics<br/>
          https://erp.buildicy.com &bull; Confidential Internal Notification
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendResendHttpEmail(notification: MailNotification): Promise<void> {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || (typeof process !== 'undefined' ? process.env.RESEND_API_KEY : '');
  if (!apiKey) {
    console.log('[Resend] Skipping direct HTTP email send — no VITE_RESEND_API_KEY found.');
    return;
  }

  const validRecipients = notification.to.filter(email => email && email.includes('@'));
  if (validRecipients.length === 0) {
    console.warn('[Resend] No valid recipient emails found for notification:', notification.subject);
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Buildicy ERP <notifications@erp.buildicy.com>',
        to: validRecipients,
        subject: notification.subject,
        html: notification.htmlText || `<p>${notification.bodyText.replace(/\n/g, '<br/>')}</p>`,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.warn('[Resend API Error Output]', result);
    } else {
      console.log('[Resend API Email Dispatched Successfully]', result);
    }
  } catch (err) {
    console.error('[Resend API Dispatch Exception]', err);
  }
}

function logNotification(notification: MailNotification): void {
  try {
    const existing = getStoredNotifications();
    const updated = [notification, ...existing];
    saveNotifications(updated);
    sendResendHttpEmail(notification);
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
  const assignerFormatted = formatUserRole(assigner);
  const contributorFormatted = formatUserRole(contributor);

  const html = buildEmailTemplate(
    'New Task Assignment',
    'Task Management',
    `
      <p>Hello <strong>${contributorFormatted}</strong>,</p>
      <p>You have been assigned a new task by <strong>${assignerFormatted}</strong> in project <strong>${project.name}</strong>.</p>
      <div class="detail-box">
        <div class="detail-item"><span class="label">📝 Task:</span> ${task.description}</div>
        <div class="detail-item"><span class="label">🎯 Project:</span> ${project.name}</div>
        <div class="detail-item"><span class="label">👤 Assigned To:</span> ${contributorFormatted}</div>
        <div class="detail-item"><span class="label">👤 Assigned By:</span> ${assignerFormatted}</div>
        <div class="detail-item"><span class="label">⚡ Priority:</span> ${(task.priority || 'medium').toUpperCase()}</div>
        <div class="detail-item"><span class="label">📅 Target Due Date:</span> ${task.dueDate || 'No deadline specified'}</div>
      </div>
      <p>Please log in to your Buildicy ERP dashboard to view task details, update status, or attach deliverables.</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Buildicy ERP] New Task Assigned: ${project.name}`,
    bodyText: `Hello ${contributor.fullName},\n\nYou have been assigned a new task by ${assignerFormatted} in project "${project.name}".\n\nTask: ${task.description}\nAssigned By: ${assignerFormatted}\nDue: ${task.dueDate || 'N/A'}`,
    htmlText: html,
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
  const reviewerFormatted = formatUserRole(reviewer);

  const html = buildEmailTemplate(
    isApproved ? 'Task Review Approved' : 'Task Sent Back for Revision',
    'Review Queue',
    `
      <p>Hello <strong>${contributor.fullName}</strong>,</p>
      <p>Your task deliverable has been reviewed by <strong>${reviewerFormatted}</strong>.</p>
      <div class="detail-box" style="border-left-color: ${isApproved ? '#10b981' : '#f59e0b'};">
        <div class="detail-item"><span class="label">📝 Task:</span> ${task.description}</div>
        <div class="detail-item"><span class="label">📋 Review Decision:</span> <strong>${isApproved ? '✅ APPROVED' : '⚠️ REVISION REQUIRED (SENT BACK)'}</strong></div>
        <div class="detail-item"><span class="label">👤 Reviewed By:</span> ${reviewerFormatted}</div>
        <div class="detail-item"><span class="label">💬 Reviewer Remarks:</span> ${remark || 'No specific remarks provided.'}</div>
      </div>
      <p>${isApproved ? 'Great job! Your work has been verified.' : 'Please address the reviewer remarks in Buildicy ERP and re-submit your task when ready.'}</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Buildicy ERP] Task Review Update: ${isApproved ? 'Approved' : 'Sent Back'}`,
    bodyText: `Hello ${contributor.fullName},\n\nYour task "${task.description}" has been reviewed by ${reviewerFormatted}.\n\nDecision: ${decision.toUpperCase()}\nRemarks: ${remark || 'None'}`,
    htmlText: html,
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
  const adminFormatted = formatUserRole(admin);

  const html = buildEmailTemplate(
    'Final Sign-Off Granted',
    'Executive Approval',
    `
      <p>Hello <strong>${contributor.fullName}</strong>,</p>
      <p>Your task has granted <strong>Final Executive Sign-Off</strong> by <strong>${adminFormatted}</strong>!</p>
      <div class="detail-box" style="border-left-color: #10b981;">
        <div class="detail-item"><span class="label">📝 Task:</span> ${task.description}</div>
        <div class="detail-item"><span class="label">👤 Approved By:</span> ${adminFormatted}</div>
        <div class="detail-item"><span class="label">🎉 Status:</span> COMPLETED & SIGNED OFF</div>
        <div class="detail-item"><span class="label">💬 Remarks:</span> ${remark || 'Founder sign-off granted.'}</div>
      </div>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Buildicy ERP] Final Sign-Off: Task Approved`,
    bodyText: `Hello ${contributor.fullName},\n\nYour task "${task.description}" has been approved by ${adminFormatted}.\nRemarks: ${remark || 'None'}`,
    htmlText: html,
    triggerEvent: 'FINAL_APPROVED',
    createdAt: new Date().toISOString(),
  });
};

export const notifyProjectDeadlineChanged = async (
  project: Project,
  members: User[],
  setBy: User,
  dueDate?: string,
  _note?: string
): Promise<void> => {
  const setByFormatted = formatUserRole(setBy);
  const newDate = dueDate || project.deadline?.dueDate || 'Not set';

  const html = buildEmailTemplate(
    'Project Deadline Updated',
    'Project Schedule',
    `
      <p>Hello Team,</p>
      <p>The target deadline for project <strong>${project.name}</strong> has been updated by <strong>${setByFormatted}</strong>.</p>
      <div class="detail-box">
        <div class="detail-item"><span class="label">🎯 Project:</span> ${project.name}</div>
        <div class="detail-item"><span class="label">📅 New Target Deadline:</span> <strong>${newDate}</strong></div>
        <div class="detail-item"><span class="label">👤 Updated By:</span> ${setByFormatted}</div>
      </div>
      <p>Please review your project task lists to align with the updated timeline.</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: members.map((m) => m.email),
    subject: `[Buildicy ERP] Project Deadline Updated: ${project.name}`,
    bodyText: `Hello Team,\n\nDeadline for ${project.name} updated to ${newDate} by ${setByFormatted}.`,
    htmlText: html,
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
  const organizerFormatted = formatUserRole(organizer);
  const meetUrl = meeting.location || 'https://meet.google.com/sbd-ccfe-hnz';

  const html = buildEmailTemplate(
    'New Meeting Invitation',
    'Schedule',
    `
      <p>Hello,</p>
      <p>You have been invited to a scheduled meeting organized by <strong>${organizerFormatted}</strong>.</p>
      <div class="detail-box">
        <div class="detail-item"><span class="label">📅 Meeting Title:</span> <strong>${meeting.title}</strong></div>
        <div class="detail-item"><span class="label">⏰ Scheduled Time:</span> ${new Date(meeting.scheduledAt).toLocaleString()}</div>
        <div class="detail-item"><span class="label">📍 Google Meet Link:</span> <a href="${meetUrl}" target="_blank" style="color: #7c3aed; font-weight: 700;">${meetUrl}</a></div>
        <div class="detail-item"><span class="label">👤 Organizer:</span> ${organizerFormatted}</div>
        ${project ? `<div class="detail-item"><span class="label">🎯 Related Project:</span> ${project.name}</div>` : ''}
        ${meeting.notes ? `<div class="detail-item"><span class="label">📝 Agenda Notes:</span> ${meeting.notes}</div>` : ''}
      </div>
      <div style="text-align: center; margin-top: 16px;">
        <a href="${meetUrl}" class="btn" style="background-color: #059669; color: #ffffff !important;" target="_blank">📹 Join Google Meet Call →</a>
      </div>
      <p>Please ensure you arrive on time or access the Google Meet link above.</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: participants.map((p) => p.email),
    subject: `[Buildicy ERP] Scheduled Meeting: ${meeting.title}`,
    bodyText: `Hello,\n\nMeeting: ${meeting.title}\nTime: ${meeting.scheduledAt}\nGoogle Meet Link: ${meetUrl}\nOrganizer: ${organizerFormatted}`,
    htmlText: html,
    triggerEvent: 'MEETING_SCHEDULED',
    createdAt: new Date().toISOString(),
  });
};

export const notifyTaskDeleted = async (
  task: Task,
  contributor: User,
  actor: User,
  project?: Project | null
): Promise<void> => {
  const actorFormatted = formatUserRole(actor);
  const contributorFormatted = formatUserRole(contributor);

  const html = buildEmailTemplate(
    'Task Cancelled / Deleted',
    'Task Management',
    `
      <p>Hello <strong>${contributorFormatted}</strong>,</p>
      <p>A task assigned to you in project <strong>${project?.name || 'General'}</strong> has been <strong>cancelled / deleted</strong> by <strong>${actorFormatted}</strong>.</p>
      <div class="detail-box" style="border-left-color: #ef4444;">
        <div class="detail-item"><span class="label">📝 Task Description:</span> ${task.description}</div>
        <div class="detail-item"><span class="label">🎯 Project:</span> ${project?.name || 'General'}</div>
        <div class="detail-item"><span class="label">👤 Deleted By:</span> ${actorFormatted}</div>
        <div class="detail-item"><span class="label">🗑️ Status:</span> CANCELLED & REMOVED FROM DASHBOARD</div>
      </div>
      <p>You are no longer required to work on or submit deliverables for this task.</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [contributor.email],
    subject: `[Buildicy ERP] Task Cancelled: ${task.description.substring(0, 30)}...`,
    bodyText: `Hello ${contributor.fullName},\n\nTask "${task.description}" assigned to you in ${project?.name || 'General'} was cancelled by ${actorFormatted}.`,
    htmlText: html,
    triggerEvent: 'TASK_DELETED',
    createdAt: new Date().toISOString(),
  });
};

export const sendDailyOverdueDigestEmail = async (
  overdueTasks: Task[],
  founders: User[]
): Promise<void> => {
  const html = buildEmailTemplate(
    'Daily Overdue Escalation Digest',
    'Executive Analytics',
    `
      <p>Hello Founders & Administrators,</p>
      <p>Here is your daily operational digest regarding overdue tasks across active projects.</p>
      <div class="detail-box" style="border-left-color: #ef4444;">
        <div class="detail-item"><span class="label">⚠️ Overdue Tasks Count:</span> <strong style="color: #dc2626;">${overdueTasks.length} Task(s) Overdue</strong></div>
        <div class="detail-item"><span class="label">📅 Digest Generated:</span> ${new Date().toLocaleDateString()}</div>
      </div>
      <p>Review the Overdue Escalation Table in your Executive Overview to follow up with assigned contributors.</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: founders.map((f) => f.email),
    subject: `[Buildicy ERP] Daily Overdue Digest (${overdueTasks.length})`,
    bodyText: `${overdueTasks.length} overdue task(s) today.`,
    htmlText: html,
    triggerEvent: 'DAILY_OVERDUE_DIGEST',
    createdAt: new Date().toISOString(),
  });
};

export const sendForgotPasswordEmail = async (
  user: User,
  passwordStr: string
): Promise<void> => {
  const html = buildEmailTemplate(
    'Password Recovery Request',
    'Account Credentials',
    `
      <p>Hello <strong>${user.fullName}</strong>,</p>
      <p>We received a password recovery request for your Buildicy ERP workspace account.</p>
      <div class="detail-box" style="border-left-color: #7c3aed;">
        <div class="detail-item"><span class="label">👤 Account User:</span> ${user.fullName}</div>
        <div class="detail-item"><span class="label">📧 Registered Email:</span> ${user.email}</div>
        <div class="detail-item"><span class="label">🔑 Workspace Password:</span> <strong style="color: #7c3aed; font-family: monospace; font-size: 16px;">${passwordStr}</strong></div>
        <div class="detail-item"><span class="label">🛡️ Role Tier:</span> ${user.roleTier.toUpperCase()}</div>
      </div>
      <p>Log in to your Buildicy ERP workspace with these credentials. You can update your password anytime under Profile Settings.</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [user.email],
    subject: `[Buildicy ERP] Password Recovery: Credentials for ${user.fullName}`,
    bodyText: `Hello ${user.fullName},\n\nYour workspace password is: ${passwordStr}\n\nLog in at https://erp.buildicy.com`,
    htmlText: html,
    triggerEvent: 'FORGOT_PASSWORD',
    createdAt: new Date().toISOString(),
  });
};

export const sendBirthdayWishEmail = async (user: User): Promise<void> => {
  const html = buildEmailTemplate(
    'Happy Birthday! 🎉🎂',
    'Special Celebration',
    `
      <p>Dear <strong>${user.fullName}</strong>,</p>
      <p>On behalf of the entire <strong>Buildicy ERP Team</strong>, we wish you a very <strong>Happy Birthday! 🎉🎂</strong></p>
      <div class="detail-box" style="border-left-color: #ec4899; background: #fdf2f8;">
        <div class="detail-item"><span class="label">🎉 Birthday Star:</span> <strong>${user.fullName}</strong></div>
        <div class="detail-item"><span class="label">💼 Position / Title:</span> ${user.title || 'Team Contributor'}</div>
        <div class="detail-item"><span class="label">🌟 Best Wishes:</span> Wishing you great success, good health, and joyful moments today and throughout the year ahead!</div>
      </div>
      <p>Thank you for being a fantastic team member!</p>
    `
  );

  logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [user.email],
    subject: `[Buildicy ERP] 🎂 Happy Birthday, ${user.fullName}!`,
    bodyText: `Happy Birthday ${user.fullName}! Wishing you a wonderful day filled with joy and success!`,
    htmlText: html,
    triggerEvent: 'BIRTHDAY_WISH',
    createdAt: new Date().toISOString(),
  });
};

export const sendWelcomeMessageToAll = async (
  users: User[],
  sender: User
): Promise<{ count: number }> => {
  let count = 0;
  for (const user of users) {
    if (!user.email || !user.email.includes('@')) continue;

    const html = buildEmailTemplate(
      'Welcome to Buildicy ERP! 🚀',
      'Team Welcome Announcement',
      `
        <p>Dear <strong>${user.fullName}</strong>,</p>
        <p>We are delighted to welcome you to the <strong>Buildicy Enterprise ERP Workspace</strong>! 🎉</p>
        <p>Your portal is fully configured for real-time task management, project execution, team chat compliance, and HR analytics.</p>
        <div class="detail-box">
          <div class="detail-item"><span class="label">👤 Member Name:</span> ${user.fullName}</div>
          <div class="detail-item"><span class="label">💼 Job Title:</span> ${user.title || 'Team Member'}</div>
          <div class="detail-item"><span class="label">🛡️ Role Access:</span> ${user.roleTier.toUpperCase()}</div>
          <div class="detail-item"><span class="label">📧 Registered Email:</span> ${user.email}</div>
          <div class="detail-item"><span class="label">📣 Dispatched By:</span> ${sender.fullName} (${sender.roleTier.toUpperCase()})</div>
        </div>
        <p>Log in anytime to view your assigned projects, collaborate with team members, and check daily shift boards.</p>
        <a href="https://meet.google.com/sbd-ccfe-hnz" class="btn">Join Team Meeting Hub</a>
      `
    );

    logNotification({
      id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: [user.email],
      subject: `[Buildicy ERP] 🚀 Special Welcome to Buildicy Workspace, ${user.fullName}!`,
      bodyText: `Dear ${user.fullName}, Welcome to Buildicy Enterprise ERP! Log in to view your assigned workspace.`,
      htmlText: html,
      triggerEvent: 'WELCOME_MESSAGE',
      createdAt: new Date().toISOString(),
    });
    count++;
  }
  return { count };
};

