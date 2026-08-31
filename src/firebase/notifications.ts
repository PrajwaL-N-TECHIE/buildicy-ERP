/**
 * Buildicy ERP Notification & Live Resend Email Engine.
 *
 * Persists notifications to localStorage for the in-app "Outbound Emails" log
 * AND dispatches direct HTTP requests to the Resend API using VITE_RESEND_API_KEY.
 */
import { getStoredNotifications, saveNotifications } from './config';
import type { MailNotification, Task, User, Project, Meeting, LeaveRequest } from '@/types';

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

async function sendResendHttpEmail(notification: MailNotification): Promise<{ success: boolean; data?: any; error?: string }> {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || (typeof process !== 'undefined' ? process.env.RESEND_API_KEY : '');
  if (!apiKey) {
    console.log('[Resend] Skipping HTTP email send — no VITE_RESEND_API_KEY configured.');
    return { success: true, data: 'Logged to local notification log (no API key)' };
  }

  const validRecipients = notification.to.filter(email => email && email.includes('@'));
  if (validRecipients.length === 0) {
    console.warn('[Resend] No valid recipient emails found for notification:', notification.subject);
    return { success: false, error: 'No valid recipient email address.' };
  }

  const configuredFrom = import.meta.env.VITE_RESEND_FROM_EMAIL || 'Buildicy ERP <notifications@erp.buildicy.com>';

  const dispatchResend = async (fromAddress: string) => {
    const payload = {
      from: fromAddress,
      to: validRecipients,
      subject: notification.subject,
      html: notification.htmlText || `<p>${notification.bodyText.replace(/\n/g, '<br/>')}</p>`,
    };

    const endpoints = [
      'https://proxy.cors.sh/https://api.resend.com/emails',
      'https://api.resend.com/emails',
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.id) {
          console.log(`[Resend API Email Dispatched via ${url}]`, data);
          return { success: true, data };
        }
        if (data.message) {
          console.warn(`[Resend Notice from ${url}]`, data.message);
        }
      } catch (e) {
        console.warn(`[Resend Endpoint Warning: ${url}]`, e);
      }
    }

    return { success: false, error: 'All email gateway endpoints failed.' };
  };

  // 1. Try sending from configured domain
  let result = await dispatchResend(configuredFrom);

  // 2. If custom domain isn't verified in Resend yet, fallback to onboarding@resend.dev
  if (!result.success && !configuredFrom.includes('onboarding@resend.dev')) {
    console.warn(`[Resend] Domain unverified for ${configuredFrom}. Retrying with onboarding@resend.dev...`);
    const fallbackResult = await dispatchResend('onboarding@resend.dev');
    if (fallbackResult.success) {
      return fallbackResult;
    }
    result = fallbackResult;
  }

  if (result.success) return result;

  console.warn('[Resend Dispatch Notice]', result.error);
  return {
    success: false,
    error: result.error,
  };
}

async function logNotification(notification: MailNotification): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = getStoredNotifications();
    const updated = [notification, ...existing];
    saveNotifications(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('erp_notifications_updated'));
    }
    return await sendResendHttpEmail(notification);
  } catch (err: any) {
    console.error('Error logging notification:', err);
    return { success: false, error: err?.message || 'Failed to log notification.' };
  }
}

export const sendCustomNotificationEmail = async (
  recipientEmail: string,
  subject: string,
  messageBody: string,
  triggerEvent: MailNotification['triggerEvent'] = 'TASK_ASSIGNED'
): Promise<{ success: boolean; error?: string }> => {
  const html = buildEmailTemplate(
    subject,
    'Buildicy Enterprise Notification',
    `
      <p>Hello <strong>${recipientEmail}</strong>,</p>
      <p>${messageBody}</p>
      <div class="detail-box">
        <div class="detail-item"><span class="label">📧 Recipient:</span> ${recipientEmail}</div>
        <div class="detail-item"><span class="label">📅 Timestamp:</span> ${new Date().toLocaleString()}</div>
        <div class="detail-item"><span class="label">🛡️ Gateway Status:</span> Active & Verified</div>
      </div>
      <p>Logged in Sent Outbound Emails Log audit trail.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [recipientEmail],
    subject: `[Buildicy ERP] ${subject}`,
    bodyText: messageBody,
    htmlText: html,
    triggerEvent,
    createdAt: new Date().toISOString(),
  });
};

export const sendTaskAssignmentEmail = async (
  task: Task,
  contributor: User,
  assigner: User,
  project: Project
): Promise<{ success: boolean; error?: string }> => {
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

  return await logNotification({
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
): Promise<{ success: boolean; error?: string }> => {
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

  return await logNotification({
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
): Promise<{ success: boolean; error?: string }> => {
  return await sendReviewStatusEmail(task, contributor, actor, 'sent_back', remark);
};

export const notifyTaskApprovedByReviewer = async (
  task: Task,
  contributor: User,
  reviewer: User,
  _admins?: User[],
  _project?: Project
): Promise<{ success: boolean; error?: string }> => {
  return await sendReviewStatusEmail(task, contributor, reviewer, 'approved', 'Reviewer approved.');
};

export const notifyTaskFinalApproved = async (
  task: Task,
  contributor: User,
  admin: User,
  remark?: string
): Promise<{ success: boolean; error?: string }> => {
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

  return await logNotification({
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
): Promise<{ success: boolean; error?: string }> => {
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

  return await logNotification({
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
): Promise<{ success: boolean; error?: string }> => {
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

  const recipientEmails = Array.from(
    new Set([...participants.map((p) => p.email), organizer.email])
  ).filter((email) => email && email.includes('@'));

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: recipientEmails.length > 0 ? recipientEmails : [organizer.email],
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
): Promise<{ success: boolean; error?: string }> => {
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

  return await logNotification({
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
): Promise<{ success: boolean; error?: string }> => {
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

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [user.email],
    subject: `[Buildicy ERP] Password Recovery: Credentials for ${user.fullName}`,
    bodyText: `Hello ${user.fullName},\n\nYour workspace password is: ${passwordStr}\n\nLog in at https://erp.buildicy.com`,
    htmlText: html,
    triggerEvent: 'FORGOT_PASSWORD',
    createdAt: new Date().toISOString(),
  });
};
export const sendPasswordChangedEmail = async (
  user: User
): Promise<{ success: boolean; error?: string }> => {
  const html = buildEmailTemplate(
    'Security Notice: Account Password Changed 🔐',
    'Account Security Notice',
    `
      <p>Hello <strong>${user.fullName}</strong>,</p>
      <p>This is a security confirmation that the workspace password for your Buildicy ERP account (<strong>${user.email}</strong>) was successfully changed.</p>
      <div class="detail-box" style="border-left-color: #10b981;">
        <div class="detail-item"><span class="label">👤 Account Name:</span> ${user.fullName}</div>
        <div class="detail-item"><span class="label">📧 Email Address:</span> ${user.email}</div>
        <div class="detail-item"><span class="label">⏰ Changed Timestamp:</span> ${new Date().toLocaleString()}</div>
        <div class="detail-item"><span class="label">🛡️ Status:</span> Password Updated Successfully</div>
      </div>
      <p>If you authorized this password change, no further action is required. If you did <strong>NOT</strong> perform this change, please contact your Buildicy ERP workspace administrator immediately.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [user.email],
    subject: `[Buildicy ERP] 🔐 Security Notice: Password Changed for ${user.fullName}`,
    bodyText: `Hello ${user.fullName},\n\nYour Buildicy ERP account password was successfully updated on ${new Date().toLocaleString()}.\n\nIf you did not perform this change, please contact your administrator immediately.`,
    htmlText: html,
    triggerEvent: 'PASSWORD_CHANGED',
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

export const sendWelcomeInviteEmail = async (user: User): Promise<{ success: boolean; error?: string }> => {
  const html = buildEmailTemplate(
    'Welcome to the Buildicy ERP Team! 🎉',
    'Team Onboarding',
    `
      <p>Dear <strong>${user.fullName}</strong>,</p>
      <p>Welcome to <strong>Buildicy ERP Platform</strong>! We are thrilled to have you join our team as <strong>${user.title || 'Team Member'}</strong>.</p>
      <div class="detail-box" style="border-left-color: #7c3aed; background: #f8fafc;">
        <div class="detail-item"><span class="label">👤 Name:</span> <strong>${user.fullName}</strong></div>
        <div class="detail-item"><span class="label">💼 Role / Title:</span> ${user.title || 'Team Member'}</div>
        <div class="detail-item"><span class="label">📧 Registered Email:</span> ${user.email}</div>
        <div class="detail-item"><span class="label">🛡️ Role Tier:</span> ${user.roleTier.toUpperCase()}</div>
        <div class="detail-item"><span class="label">📅 Date of Joining:</span> ${user.dateOfJoining || 'Recent'}</div>
      </div>
      <p>You can now access your workspace, view active projects, track tasks, and collaborate with your team at <a href="https://erp.buildicy.com" style="color: #7c3aed; font-weight: 700;">https://erp.buildicy.com</a>.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [user.email],
    subject: `[Buildicy ERP] Welcome to the Team, ${user.fullName}! 🎉`,
    bodyText: `Dear ${user.fullName},\n\nWelcome to Buildicy ERP! We are excited to have you on board as ${user.title || 'Team Member'}.\n\nAccess your account at https://erp.buildicy.com`,
    htmlText: html,
    triggerEvent: 'WELCOME_INVITE',
    createdAt: new Date().toISOString(),
  });
};

export const sendShiftCheckInEmail = async (
  user: User,
  checkInTime: string,
  adminsAndReviewers: User[]
): Promise<{ success: boolean; error?: string }> => {
  const recipientEmails = Array.from(new Set(adminsAndReviewers.map((u) => u.email))).filter((e) => e && e.includes('@'));
  if (recipientEmails.length === 0) return { success: true };

  const userRoleStr = formatUserRole(user);
  const html = buildEmailTemplate(
    'Intern Shift Check-In Alert 🟢',
    'Shift & Attendance Tracking',
    `
      <p>Hello Admins & Reviewers,</p>
      <p><strong>${userRoleStr}</strong> has checked in and started their shift.</p>
      <div class="detail-box" style="border-left-color: #10b981;">
        <div class="detail-item"><span class="label">👤 Team Member:</span> <strong>${user.fullName}</strong></div>
        <div class="detail-item"><span class="label">💼 Role / Position:</span> ${user.title || user.roleTier}</div>
        <div class="detail-item"><span class="label">⏰ Check-In Time:</span> <strong>${checkInTime}</strong></div>
        <div class="detail-item"><span class="label">📅 Date:</span> ${new Date().toLocaleDateString()}</div>
        <div class="detail-item"><span class="label">🟢 Shift Status:</span> ACTIVE & WORKING</div>
      </div>
      <p>You can monitor active intern shift status in real-time on the Intern Shift Board.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: recipientEmails,
    subject: `[Buildicy ERP] 🟢 Shift Check-In: ${user.fullName}`,
    bodyText: `${user.fullName} checked in for shift at ${checkInTime}.`,
    htmlText: html,
    triggerEvent: 'SHIFT_CHECK_IN',
    createdAt: new Date().toISOString(),
  });
};

export const sendShiftCheckOutEmail = async (
  user: User,
  checkOutTime: string,
  durationHrs: number,
  totalWorkedHoursToday: number,
  adminsAndReviewers: User[]
): Promise<{ success: boolean; error?: string }> => {
  const recipientEmails = Array.from(new Set(adminsAndReviewers.map((u) => u.email))).filter((e) => e && e.includes('@'));
  if (recipientEmails.length === 0) return { success: true };

  const userRoleStr = formatUserRole(user);
  const html = buildEmailTemplate(
    'Intern Shift Check-Out Alert 🔴',
    'Shift & Attendance Tracking',
    `
      <p>Hello Admins & Reviewers,</p>
      <p><strong>${userRoleStr}</strong> has completed their shift session and checked out.</p>
      <div class="detail-box" style="border-left-color: #7c3aed;">
        <div class="detail-item"><span class="label">👤 Team Member:</span> <strong>${user.fullName}</strong></div>
        <div class="detail-item"><span class="label">💼 Role / Position:</span> ${user.title || user.roleTier}</div>
        <div class="detail-item"><span class="label">⏰ Check-Out Time:</span> <strong>${checkOutTime}</strong></div>
        <div class="detail-item"><span class="label">⏱️ Session Duration:</span> ${durationHrs.toFixed(2)} hrs</div>
        <div class="detail-item"><span class="label">📊 Total Worked Today:</span> <strong>${totalWorkedHoursToday.toFixed(2)} hrs</strong></div>
        <div class="detail-item"><span class="label">📅 Date:</span> ${new Date().toLocaleDateString()}</div>
      </div>
      <p>Detailed shift logs are updated in your ERP Intern Shift Board.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: recipientEmails,
    subject: `[Buildicy ERP] 🔴 Shift Check-Out: ${user.fullName} (${totalWorkedHoursToday.toFixed(1)} hrs)`,
    bodyText: `${user.fullName} checked out at ${checkOutTime}. Session: ${durationHrs.toFixed(2)} hrs. Total Today: ${totalWorkedHoursToday.toFixed(2)} hrs.`,
    htmlText: html,
    triggerEvent: 'SHIFT_CHECK_OUT',
    createdAt: new Date().toISOString(),
  });
};

export const sendLeaveRequestRaisedEmail = async (
  request: LeaveRequest,
  requester: User,
  recipients: User[]
): Promise<{ success: boolean; error?: string }> => {
  const recipientEmails = Array.from(new Set(recipients.map((u) => u.email))).filter((e) => e && e.includes('@'));
  if (recipientEmails.length === 0) return { success: true };

  const isPermission = request.requestType === 'permission';
  const typeLabel = isPermission ? 'Short Hours Permission' : 'Full Leave Request';
  const timeInfo = isPermission
    ? `<div class="detail-item"><span class="label">⏰ Time Window:</span> ${request.startTime || '—'} to ${request.endTime || '—'} (${request.permissionHours || 0} hrs)</div>`
    : `<div class="detail-item"><span class="label">📅 Leave Dates:</span> ${request.startDate} to ${request.endDate}</div>`;

  const html = buildEmailTemplate(
    `New ${typeLabel} Raised 📝`,
    'Leave & Permission Workflow',
    `
      <p>Hello,</p>
      <p>A new <strong>${typeLabel}</strong> has been submitted by <strong>${requester.fullName}</strong> (${requester.title || requester.roleTier}).</p>
      <div class="detail-box" style="border-left-color: #8b5cf6;">
        <div class="detail-item"><span class="label">👤 Requester:</span> <strong>${requester.fullName}</strong></div>
        <div class="detail-item"><span class="label">💼 Role Tier:</span> ${requester.roleTier.toUpperCase()}</div>
        <div class="detail-item"><span class="label">🏷️ Category:</span> ${request.leaveCategory.toUpperCase().replace('_', ' ')}</div>
        ${timeInfo}
        <div class="detail-item"><span class="label">💬 Reason:</span> <em>"${request.reason}"</em></div>
        <div class="detail-item"><span class="label">⌛ Workflow Status:</span> ${request.status === 'pending_reviewer' ? 'Pending Reviewer Sign-off' : 'Pending Admin Sign-off'}</div>
      </div>
      <p>Please review and take action on the request in the <strong>Buildicy ERP Leave & Permissions Hub</strong>.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: recipientEmails,
    subject: `[Buildicy ERP] 📝 New ${typeLabel}: ${requester.fullName}`,
    bodyText: `New ${typeLabel} raised by ${requester.fullName}. Reason: ${request.reason}`,
    htmlText: html,
    triggerEvent: 'LEAVE_REQUEST_RAISED',
    createdAt: new Date().toISOString(),
  });
};

export const sendLeaveApprovedByReviewerEmail = async (
  request: LeaveRequest,
  requester: User,
  reviewer: User,
  admins: User[]
): Promise<{ success: boolean; error?: string }> => {
  const isPermission = request.requestType === 'permission';
  const typeLabel = isPermission ? 'Permission' : 'Leave';
  
  // Send email to Requester
  const requesterHtml = buildEmailTemplate(
    `${typeLabel} Request Approved by Reviewer ✍️`,
    'Reviewer Sign-off',
    `
      <p>Hello ${requester.fullName},</p>
      <p>Your <strong>${typeLabel} Request</strong> has been <strong>APPROVED</strong> by your reviewer, <strong>${reviewer.fullName}</strong>!</p>
      <div class="detail-box" style="border-left-color: #3b82f6;">
        <div class="detail-item"><span class="label">✍️ Approved By Reviewer:</span> ${reviewer.fullName}</div>
        <div class="detail-item"><span class="label">📅 Dates / Time:</span> ${request.startDate} ${isPermission ? `(${request.startTime} - ${request.endTime})` : `to ${request.endDate}`}</div>
        <div class="detail-item"><span class="label">💬 Reviewer Remarks:</span> <em>"${request.reviewerRemark || 'Looks good'}"</em></div>
        <div class="detail-item"><span class="label">⌛ Next Step:</span> Forwarded to Founders (Prajwal & Mayur) for final sign-off.</div>
      </div>
    `
  );

  await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [requester.email],
    subject: `[Buildicy ERP] ✍️ ${typeLabel} Approved by Reviewer (${reviewer.fullName})`,
    bodyText: `Your ${typeLabel} request was approved by reviewer ${reviewer.fullName} and sent to admins.`,
    htmlText: requesterHtml,
    triggerEvent: 'LEAVE_REVIEWER_APPROVED',
    createdAt: new Date().toISOString(),
  });

  // Also notify Admins
  const adminEmails = Array.from(new Set(admins.map(u => u.email))).filter(e => e && e.includes('@'));
  if (adminEmails.length > 0) {
    const adminHtml = buildEmailTemplate(
      `Action Needed: ${typeLabel} Approved by Reviewer 📩`,
      'Founder Final Sign-Off',
      `
        <p>Hello Admins,</p>
        <p>Reviewer <strong>${reviewer.fullName}</strong> has approved the ${typeLabel.toLowerCase()} request for <strong>${requester.fullName}</strong>.</p>
        <div class="detail-box" style="border-left-color: #7c3aed;">
          <div class="detail-item"><span class="label">👤 Intern Requester:</span> <strong>${requester.fullName}</strong></div>
          <div class="detail-item"><span class="label">✍️ Approved By Reviewer:</span> ${reviewer.fullName}</div>
          <div class="detail-item"><span class="label">📅 Dates / Time:</span> ${request.startDate} ${isPermission ? `(${request.startTime} - ${request.endTime})` : `to ${request.endDate}`}</div>
          <div class="detail-item"><span class="label">💬 Reason:</span> <em>"${request.reason}"</em></div>
        </div>
        <p>Please grant final approval in the Leave & Permissions Hub.</p>
      `
    );

    await logNotification({
      id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: adminEmails,
      subject: `[Buildicy ERP] 📩 Action Required: ${typeLabel} for ${requester.fullName} (Approved by ${reviewer.fullName})`,
      bodyText: `${typeLabel} for ${requester.fullName} approved by ${reviewer.fullName}, pending admin sign-off.`,
      htmlText: adminHtml,
      triggerEvent: 'LEAVE_PENDING_ADMIN',
      createdAt: new Date().toISOString(),
    });
  }

  return { success: true };
};

export const sendLeaveFinalApprovedByAdminEmail = async (
  request: LeaveRequest,
  requester: User,
  admin: User
): Promise<{ success: boolean; error?: string }> => {
  const isPermission = request.requestType === 'permission';
  const typeLabel = isPermission ? 'Permission' : 'Leave';

  const html = buildEmailTemplate(
    `🎉 ${typeLabel} Request Granted Final Approval!`,
    'Final Sign-Off Granted',
    `
      <p>Hello ${requester.fullName},</p>
      <p>Great news! Your <strong>${typeLabel} Request</strong> has been granted <strong>FINAL APPROVAL</strong> by Founder / Admin <strong>${admin.fullName}</strong>.</p>
      <div class="detail-box" style="border-left-color: #10b981;">
        <div class="detail-item"><span class="label">👤 Requester:</span> <strong>${requester.fullName}</strong></div>
        <div class="detail-item"><span class="label">👑 Final Approved By:</span> <strong>${admin.fullName} (Founder/Admin)</strong></div>
        <div class="detail-item"><span class="label">📅 Dates / Time:</span> ${request.startDate} ${isPermission ? `(${request.startTime} - ${request.endTime})` : `to ${request.endDate}`}</div>
        <div class="detail-item"><span class="label">🏷️ Category:</span> ${request.leaveCategory.toUpperCase().replace('_', ' ')}</div>
        <div class="detail-item"><span class="label">💬 Admin Remarks:</span> <em>"${request.adminRemark || 'Granted'}"</em></div>
        <div class="detail-item"><span class="label">✅ Status:</span> FULLY APPROVED</div>
      </div>
      <p>Enjoy your time off! Your attendance record has been updated accordingly.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [requester.email],
    subject: `[Buildicy ERP] 🎉 ${typeLabel} Request Granted Final Approval! (${request.startDate})`,
    bodyText: `Your ${typeLabel} request for ${request.startDate} was granted final approval by ${admin.fullName}.`,
    htmlText: html,
    triggerEvent: 'LEAVE_FINAL_APPROVED',
    createdAt: new Date().toISOString(),
  });
};

export const sendLeaveRejectedEmail = async (
  request: LeaveRequest,
  requester: User,
  actor: User,
  remark: string
): Promise<{ success: boolean; error?: string }> => {
  const isPermission = request.requestType === 'permission';
  const typeLabel = isPermission ? 'Permission' : 'Leave';

  const html = buildEmailTemplate(
    `⚠️ ${typeLabel} Request Rejected`,
    'Request Decision',
    `
      <p>Hello ${requester.fullName},</p>
      <p>Your <strong>${typeLabel} Request</strong> for <strong>${request.startDate}</strong> has been <strong>REJECTED</strong> by <strong>${actor.fullName}</strong> (${actor.title || actor.roleTier}).</p>
      <div class="detail-box" style="border-left-color: #ef4444;">
        <div class="detail-item"><span class="label">👤 Decision Maker:</span> ${actor.fullName} (${actor.roleTier.toUpperCase()})</div>
        <div class="detail-item"><span class="label">📅 Requested Date(s):</span> ${request.startDate} ${isPermission ? `(${request.startTime} - ${request.endTime})` : `to ${request.endDate}`}</div>
        <div class="detail-item"><span class="label">💬 Rejection Remarks:</span> <em>"${remark || 'Not approved at this time'}"</em></div>
        <div class="detail-item"><span class="label">❌ Status:</span> REJECTED</div>
      </div>
      <p>If you have any questions, please contact your reviewer or management.</p>
    `
  );

  return await logNotification({
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: [requester.email],
    subject: `[Buildicy ERP] ⚠️ ${typeLabel} Request Rejected`,
    bodyText: `Your ${typeLabel} request for ${request.startDate} was rejected by ${actor.fullName}. Reason: ${remark}`,
    htmlText: html,
    triggerEvent: 'LEAVE_REJECTED',
    createdAt: new Date().toISOString(),
  });
};



