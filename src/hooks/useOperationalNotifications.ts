import { useAuth } from '@/context/AuthContext';
import { todayIso } from '@/lib/date';

export interface OperationalAlert {
  id: string;
  category: 'check_in' | 'overdue' | 'meeting' | 'review' | 'system';
  title: string;
  description: string;
  timestamp: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'rose' | 'amber' | 'sky' | 'purple' | 'indigo';
  meta?: any;
}

export function useOperationalNotifications() {
  const { currentUser, users, tasks, meetings, attendanceRecords, notifications } = useAuth();

  if (!currentUser) return { alerts: [], unreadCount: 0 };

  const todayStr = todayIso();
  const alerts: OperationalAlert[] = [];
  const isAdminOrReviewer = currentUser.roleTier === 'admin' || currentUser.roleTier === 'reviewer';
  const userEmailLower = (currentUser.email || '').toLowerCase();

  // 1. Check-In & Attendance Alerts for Today (Reviewers & Admins ONLY)
  if (isAdminOrReviewer) {
    const todayAttendance = attendanceRecords.filter(r => r.date === todayStr);
    todayAttendance.forEach(rec => {
      const user = users.find(u => u.id === rec.userId);
      const name = user ? user.fullName : 'Team Member';
      const latestSess = rec.sessions?.[rec.sessions.length - 1];

      if (rec.status === 'checked_in') {
        alerts.push({
          id: `checkin-${rec.id}`,
          category: 'check_in',
          title: `${name} Checked In`,
          description: `Checked in today at ${latestSess?.checkInTime || '09:00 AM'}.`,
          timestamp: latestSess?.sessionStartTimestamp || new Date().toISOString(),
          badgeLabel: 'Live Check-In',
          badgeColor: 'emerald',
        });
      } else if (rec.status === 'checked_out') {
        const calculatedHours = (rec.sessions || []).reduce((sum, s) => sum + (s.durationHours || 0), 0);
        alerts.push({
          id: `checkout-${rec.id}`,
          category: 'check_in',
          title: `${name} Shift Completed`,
          description: `Completed shift today with ${calculatedHours.toFixed(1)} hrs logged.`,
          timestamp: latestSess?.sessionEndTimestamp || latestSess?.sessionStartTimestamp || new Date().toISOString(),
          badgeLabel: 'Shift Closed',
          badgeColor: 'indigo',
        });
      }
    });
  }

  // 2. Overdue Task Notifications
  // - Admins/Reviewers see all overdue tasks
  // - Interns/Contributors see ONLY tasks assigned to themselves
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'Completed' || !t.dueDate) return false;
    if (t.dueDate >= todayStr) return false;
    if (!isAdminOrReviewer && t.contributorId !== currentUser.id) return false;
    return true;
  });

  overdueTasks.forEach(t => {
    const assignee = users.find(u => u.id === t.contributorId);
    alerts.push({
      id: `overdue-${t.id}`,
      category: 'overdue',
      title: `Task Overdue: ${t.description.substring(0, 45)}...`,
      description: `Target deadline was ${t.dueDate}. ${isAdminOrReviewer ? `Assigned to ${assignee?.fullName || 'Contributor'}.` : 'Please complete and submit for review.'}`,
      timestamp: t.dueDate || new Date().toISOString(),
      badgeLabel: 'Overdue Alert',
      badgeColor: 'rose',
      meta: t,
    });
  });

  // 3. Scheduled Meetings Notifications
  meetings.forEach(m => {
    const isParticipant = !m.participantIds || m.participantIds.length === 0 || m.participantIds.includes(currentUser.id) || currentUser.roleTier === 'admin';
    if (isParticipant) {
      alerts.push({
        id: `meeting-${m.id}`,
        category: 'meeting',
        title: `Meeting: ${m.title}`,
        description: `Scheduled at ${new Date(m.scheduledAt).toLocaleDateString()} ${new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Location: ${m.location || 'Google Meet'}`,
        timestamp: m.scheduledAt,
        badgeLabel: 'Meeting Scheduled',
        badgeColor: 'sky',
        meta: m,
      });
    }
  });

  // 4. Pending Review & Admin Approvals (Reviewers & Admins ONLY)
  if (isAdminOrReviewer) {
    const pendingTasks = tasks.filter(t => 
      (currentUser.roleTier === 'reviewer' && t.status === 'Submitted') ||
      (currentUser.roleTier === 'admin' && (t.status === 'Submitted' || t.status === 'Pending Admin'))
    );
    pendingTasks.forEach(t => {
      alerts.push({
        id: `review-${t.id}`,
        category: 'review',
        title: `Sign-Off Required: ${t.description.substring(0, 45)}...`,
        description: `Task status is "${t.status}". Priority: ${t.priority?.toUpperCase() || 'MEDIUM'}.`,
        timestamp: t.dueDate || new Date().toISOString(),
        badgeLabel: 'Review Pending',
        badgeColor: 'amber',
        meta: t,
      });
    });
  }

  // 5. System Notifications / Invites
  // - Admins/Reviewers see top 5 recent system emails
  // - Interns/Contributors see ONLY notifications sent specifically to their email address
  notifications.slice(0, 10).forEach(n => {
    const recipientEmails = (n.to || []).map(e => e.toLowerCase());
    const isTargetedToUser = recipientEmails.includes(userEmailLower);

    if (isAdminOrReviewer) {
      if (n.triggerEvent === 'SHIFT_CHECK_IN' || n.triggerEvent === 'SHIFT_CHECK_OUT') {
        return;
      }
      alerts.push({
        id: `email-${n.id}`,
        category: 'system',
        title: `Outbound Email: ${n.subject}`,
        description: `Sent to ${n.to.join(', ')}.`,
        timestamp: n.createdAt,
        badgeLabel: n.triggerEvent ? n.triggerEvent.replace(/_/g, ' ') : 'Email Sent',
        badgeColor: 'purple',
        meta: n,
      });
    } else if (isTargetedToUser) {
      alerts.push({
        id: `email-${n.id}`,
        category: 'system',
        title: n.subject,
        description: n.bodyText || 'You received an official ERP notification.',
        timestamp: n.createdAt,
        badgeLabel: 'Notification',
        badgeColor: 'purple',
        meta: n,
      });
    }
  });

  // Sort alerts by recency / priority
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    alerts,
    unreadCount: alerts.length,
  };
}
