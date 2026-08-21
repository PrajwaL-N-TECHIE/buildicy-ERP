import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Project, 
  Task, 
  Meeting, 
  MailNotification, 
  SystemAuditLog,
  TaskPriority,
  TaskStatus,
  ActivityLogEntry,
  TaskChecklistItem,
  ChatMessage,
  AttendanceRecord
} from '@/types';
import { 
  getStoredUsers, 
  getStoredProjects, 
  getStoredTasks, 
  getStoredMeetings, 
  getStoredNotifications, 
  getStoredAuditLogs,
  saveUsers,
  saveProjects,
  saveTasks,
  saveMeetings,
  saveNotifications,
  saveAuditLogs,
  SEED_USERS
} from '@/firebase/config';
import { webSocketService } from '@/services/websocket';
import { 
  notifyTaskAssigned,
  notifyTaskSentBack,
  notifyTaskApprovedByReviewer,
  notifyTaskFinalApproved,
  notifyProjectDeadlineChanged,
  notifyMeetingScheduled
} from '@/firebase/notifications';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  notifications: MailNotification[];
  auditLogs: SystemAuditLog[];
  chatMessages: ChatMessage[];
  attendanceRecords: AttendanceRecord[];
  loginAsUser: (userId: string) => void;
  loginWithCredentials: (email: string, pass: string) => Promise<boolean>;
  changePassword: (newPass: string) => Promise<void>;
  logout: () => void;
  createTask: (data: {
    contributorId: string;
    projectId: string;
    description: string;
    hours: number;
    priority?: TaskPriority;
    dueDate?: string;
    deliverableUrl?: string;
    checklist?: TaskChecklistItem[];
  }) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  reviewTaskByReviewer: (taskId: string, decision: 'approved' | 'sent_back', remark: string) => Promise<void>;
  reviewTaskByAdmin: (taskId: string, decision: 'approved' | 'sent_back', remark: string) => Promise<void>;
  updateProjectDeadline: (projectId: string, dueDate: string, note: string) => Promise<void>;
  setProjectDeadline: (projectId: string, dueDate: string, note: string) => Promise<void>;
  scheduleMeeting: (data: {
    title: string;
    projectId?: string | null;
    participantIds: string[];
    scheduledAt: string;
    location: string;
    notes: string;
  }) => Promise<void>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  sendChatMessage: (data: { text: string; channelId?: string | null; recipientId?: string | null }) => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'> | string, memberIds?: string[]) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  addAuditLog: (action: string, target: string, details: string) => void;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<MailNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const local = localStorage.getItem('erp_chat_messages');
    return local ? JSON.parse(local) : [
      {
        id: 'msg-1',
        senderId: 'user-1',
        channelId: '#general',
        text: 'Welcome team! Let us deliver Sprint 4 deliverables on schedule.',
        timestamp: new Date('2026-08-21T09:00:00').toISOString()
      },
      {
        id: 'msg-2',
        senderId: 'user-3',
        channelId: '#general',
        text: 'Reviewer first-pass checklist is active. Submit PR links for review.',
        timestamp: new Date('2026-08-21T09:15:00').toISOString()
      }
    ];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const local = localStorage.getItem('erp_attendance_records');
    return local ? JSON.parse(local) : [
      {
        id: 'att-1',
        userId: 'user-5',
        date: '2026-08-21',
        checkInTime: '09:30 AM',
        status: 'checked_in'
      },
      {
        id: 'att-2',
        userId: 'user-6',
        date: '2026-08-21',
        checkInTime: '09:15 AM',
        status: 'checked_in'
      }
    ];
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('erp_active_user_id') || 'user-1';
  });

  const refreshData = () => {
    setUsers(getStoredUsers());
    setProjects(getStoredProjects());
    setTasks(getStoredTasks());
    setMeetings(getStoredMeetings());
    setNotifications(getStoredNotifications());
    setAuditLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || null;

  const loginAsUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    setCurrentUserId(userId);
    localStorage.setItem('erp_active_user_id', userId);

    if (currentUser && currentUser.id !== userId) {
      addAuditLog(
        'PERSONA_SWITCHED', 
        `User: ${targetUser.fullName}`, 
        `Session persona switched to ${targetUser.fullName} (${targetUser.roleTier}).`
      );
    }
  };

  const loginWithCredentials = async (email: string, pass: string): Promise<boolean> => {
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!targetUser) return false;

    // Check role default passwords or custom password
    let expectedPass = targetUser.password;
    if (!expectedPass) {
      if (targetUser.roleTier === 'admin') expectedPass = 'admin@123';
      else if (targetUser.roleTier === 'reviewer') expectedPass = 'reviewer@123';
      else expectedPass = 'intern@123';
    }

    if (pass === expectedPass) {
      setCurrentUserId(targetUser.id);
      localStorage.setItem('erp_active_user_id', targetUser.id);
      addAuditLog('USER_LOGGED_IN', `User: ${targetUser.fullName}`, `Authenticated with email ${email}`);
      return true;
    }

    return false;
  };

  const changePassword = async (newPass: string) => {
    if (!currentUser) return;
    await updateUser(currentUser.id, { password: newPass });
    addAuditLog('PASSWORD_CHANGED', `User: ${currentUser.fullName}`, `Updated account password.`);
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem('erp_active_user_id');
    localStorage.removeItem('erp_theme');
    window.location.reload();
  };

  useEffect(() => {
    const unsubscribe = webSocketService.onMessage((incomingMsg) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === incomingMsg.id)) return prev;
        const updated = [...prev, incomingMsg];
        localStorage.setItem('erp_chat_messages', JSON.stringify(updated));
        return updated;
      });
    });
    return () => unsubscribe();
  }, []);

  const sendChatMessage = async (data: { text: string; channelId?: string | null; recipientId?: string | null }) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      channelId: data.channelId || null,
      recipientId: data.recipientId || null,
      text: data.text,
      timestamp: new Date().toISOString()
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem('erp_chat_messages', JSON.stringify(updated));

    // Dispatch via real-time WebSockets
    webSocketService.sendMessage({
      senderId: currentUser.id,
      text: data.text,
      channelId: data.channelId,
      recipientId: data.recipientId
    });
  };

  const checkIn = async () => {
    if (!currentUser) return;
    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = '2026-08-21';

    const existingRecord = attendanceRecords.find(r => r.userId === currentUser.id && r.date === todayStr);

    const newSession = {
      id: 'sess-' + Date.now(),
      checkInTime: nowTimeStr,
      sessionStartTimestamp: now.toISOString()
    };

    let updatedRecords: AttendanceRecord[];

    if (existingRecord) {
      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        sessions: [...(existingRecord.sessions || []), newSession],
        status: 'checked_in'
      };
      updatedRecords = attendanceRecords.map(r => r.id === existingRecord.id ? updatedRecord : r);
    } else {
      const newRecord: AttendanceRecord = {
        id: 'att-' + Date.now(),
        userId: currentUser.id,
        date: todayStr,
        sessions: [newSession],
        totalWorkedHoursToday: 0,
        status: 'checked_in'
      };
      updatedRecords = [newRecord, ...attendanceRecords];
    }

    setAttendanceRecords(updatedRecords);
    localStorage.setItem('erp_attendance_records', JSON.stringify(updatedRecords));
    addAuditLog('INTERN_CHECKED_IN', `User: ${currentUser.fullName}`, `Checked in for flexible session at ${nowTimeStr}`);
  };

  const checkOut = async () => {
    if (!currentUser) return;
    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = '2026-08-21';

    const existingRecord = attendanceRecords.find(r => r.userId === currentUser.id && r.date === todayStr);
    if (!existingRecord) return;

    const updatedSessions = (existingRecord.sessions || []).map(sess => {
      if (!sess.checkOutTime) {
        const startTime = new Date(sess.sessionStartTimestamp).getTime();
        const durationHrs = Math.max(0.1, parseFloat(((now.getTime() - startTime) / (1000 * 3600)).toFixed(2)));
        return {
          ...sess,
          checkOutTime: nowTimeStr,
          sessionEndTimestamp: now.toISOString(),
          durationHours: durationHrs
        };
      }
      return sess;
    });

    const sumTotalHours = updatedSessions.reduce((sum, s) => sum + (s.durationHours || 0), 0);

    const updatedRecord: AttendanceRecord = {
      ...existingRecord,
      sessions: updatedSessions,
      totalWorkedHoursToday: parseFloat(sumTotalHours.toFixed(2)),
      status: 'checked_out'
    };

    const updatedRecords = attendanceRecords.map(r => r.id === existingRecord.id ? updatedRecord : r);
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('erp_attendance_records', JSON.stringify(updatedRecords));
    addAuditLog('INTERN_CHECKED_OUT', `User: ${currentUser.fullName}`, `Checked out session at ${nowTimeStr}. Total today: ${sumTotalHours.toFixed(2)} hrs`);
  };

  const addAuditLog = (action: string, target: string, details: string) => {
    if (!currentUser) return;
    const newLog: SystemAuditLog = {
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action,
      target,
      details
    };

    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveAuditLogs(updated);
  };

  const updateProjectDeadline = async (projectId: string, dueDate: string, note: string) => {
    if (!currentUser) return;
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const deadlineObj = {
      dueDate,
      note,
      setBy: currentUser.id,
      setAt: new Date().toISOString()
    };

    const updatedProj: Project = { ...proj, deadline: deadlineObj };
    const updatedList = projects.map(p => p.id === projectId ? updatedProj : p);
    setProjects(updatedList);
    saveProjects(updatedList);

    const projMembers = users.filter(u => proj.memberIds.includes(u.id));
    await notifyProjectDeadlineChanged(updatedProj, projMembers, currentUser, dueDate, note);

    addAuditLog('PROJECT_DEADLINE_UPDATED', `Project: ${proj.name}`, `Target due date set to ${dueDate}. Note: ${note || 'N/A'}`);
    refreshData();
  };

  const setProjectDeadline = updateProjectDeadline;

  const createTask = async (data: {
    contributorId: string;
    projectId: string;
    description: string;
    hours: number;
    priority?: TaskPriority;
    dueDate?: string;
    deliverableUrl?: string;
    checklist?: TaskChecklistItem[];
  }) => {
    if (!currentUser) return;

    const isSelfLogged = data.contributorId === currentUser.id;
    const initialActivity: ActivityLogEntry = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action: isSelfLogged ? 'Created task (Self-logged)' : `Assigned task to ${users.find(u => u.id === data.contributorId)?.fullName}`
    };

    const newTask: Task = {
      id: 'task-' + Date.now(),
      contributorId: data.contributorId,
      assignedBy: isSelfLogged ? null : currentUser.id,
      projectId: data.projectId,
      taskDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || null,
      deliverableUrl: data.deliverableUrl || null,
      checklist: data.checklist || [],
      description: data.description,
      hours: data.hours,
      priority: data.priority || 'medium',
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityLog: [initialActivity]
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    const assignee = users.find(u => u.id === data.contributorId);
    const proj = projects.find(p => p.id === data.projectId);

    if (!isSelfLogged && assignee && proj) {
      await notifyTaskAssigned(newTask, assignee, currentUser, proj);
    }

    addAuditLog(
      isSelfLogged ? 'TASK_LOGGED' : 'TASK_ASSIGNED', 
      `Task: ${data.description.substring(0, 30)}...`, 
      `Logged ${data.hours} hrs for ${proj?.name || 'General'}. Priority: ${data.priority || 'medium'}.`
    );

    refreshData();
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!currentUser) return;
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const activity: ActivityLogEntry = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action: `Status changed to ${status}`
    };

    const updatedTask: Task = {
      ...targetTask,
      status,
      updatedAt: new Date().toISOString(),
      activityLog: [activity, ...(targetTask.activityLog || [])]
    };

    const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    addAuditLog('TASK_STATUS_UPDATED', `Task: ${targetTask.description.substring(0, 30)}...`, `Status updated from ${targetTask.status} to ${status}`);
    refreshData();
  };

  const reviewTaskByReviewer = async (taskId: string, decision: 'approved' | 'sent_back', remark: string) => {
    if (!currentUser) return;
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const isApprove = decision === 'approved';
    const newStatus: TaskStatus = isApprove ? 'Pending Admin' : 'In Progress';

    const activity: ActivityLogEntry = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action: isApprove ? 'Reviewer Approved (Moved to Pending Admin)' : 'Reviewer Sent Back for Revisions',
      note: remark || undefined
    };

    const updatedTask: Task = {
      ...targetTask,
      status: newStatus,
      reviewerId: currentUser.id,
      reviewerDecision: decision,
      reviewerRemark: remark,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityLog: [activity, ...(targetTask.activityLog || [])]
    };

    const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    const contributor = users.find(u => u.id === targetTask.contributorId);
    const proj = projects.find(p => p.id === targetTask.projectId);

    if (isApprove) {
      const admins = users.filter(u => u.roleTier === 'admin');
      if (contributor && proj) {
        await notifyTaskApprovedByReviewer(updatedTask, contributor, currentUser, admins, proj);
      }
    } else {
      if (contributor) {
        await notifyTaskSentBack(updatedTask, contributor, currentUser, remark);
      }
    }

    addAuditLog(isApprove ? 'REVIEWER_APPROVED' : 'REVIEWER_SENT_BACK', `Task: ${targetTask.description.substring(0, 30)}...`, `Remark: ${remark || 'None'}`);
    refreshData();
  };

  const reviewTaskByAdmin = async (taskId: string, decision: 'approved' | 'sent_back', remark: string) => {
    if (!currentUser) return;
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const isApprove = decision === 'approved';
    const newStatus: TaskStatus = isApprove ? 'Completed' : 'In Progress';

    const activity: ActivityLogEntry = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action: isApprove ? 'Final Admin Approved (Completed)' : 'Admin Sent Back for Revisions',
      note: remark || undefined
    };

    const updatedTask: Task = {
      ...targetTask,
      status: newStatus,
      adminId: currentUser.id,
      adminDecision: decision,
      adminRemark: remark,
      approvedAt: isApprove ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
      activityLog: [activity, ...(targetTask.activityLog || [])]
    };

    const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    const contributor = users.find(u => u.id === targetTask.contributorId);

    if (isApprove) {
      if (contributor) {
        await notifyTaskFinalApproved(updatedTask, contributor, currentUser, remark);
      }
    } else {
      if (contributor) {
        await notifyTaskSentBack(updatedTask, contributor, currentUser, remark);
      }
    }

    addAuditLog(isApprove ? 'ADMIN_FINAL_APPROVED' : 'ADMIN_SENT_BACK', `Task: ${targetTask.description.substring(0, 30)}...`, `Remark: ${remark || 'None'}`);
    refreshData();
  };

  const scheduleMeeting = async (data: {
    title: string;
    projectId?: string | null;
    participantIds: string[];
    scheduledAt: string;
    location: string;
    notes: string;
  }) => {
    if (!currentUser) return;

    const newMeeting: Meeting = {
      id: 'meet-' + Date.now(),
      title: data.title,
      projectId: data.projectId || null,
      participantIds: data.participantIds,
      scheduledAt: data.scheduledAt,
      location: data.location,
      notes: data.notes,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    const updatedMeetings = [newMeeting, ...meetings];
    setMeetings(updatedMeetings);
    saveMeetings(updatedMeetings);

    const participants = users.filter(u => data.participantIds.includes(u.id));
    const proj = data.projectId ? projects.find(p => p.id === data.projectId) : null;
    await notifyMeetingScheduled(newMeeting, participants, currentUser, proj);

    addAuditLog('MEETING_SCHEDULED', `Meeting: ${data.title}`, `Scheduled for ${new Date(data.scheduledAt).toLocaleString()} with ${data.participantIds.length} attendees`);
    refreshData();
  };

  const deleteMeeting = async (meetingId: string) => {
    if (!currentUser) return;
    const target = meetings.find(m => m.id === meetingId);
    if (!target) return;

    const updated = meetings.filter(m => m.id !== meetingId);
    setMeetings(updated);
    saveMeetings(updated);

    addAuditLog('MEETING_DELETED', `Meeting: ${target.title}`, `Cancelled and deleted by ${currentUser.fullName} (${currentUser.roleTier})`);
    refreshData();
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: 'user-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    addAuditLog('USER_CREATED', `User: ${newUser.fullName}`, `Created user ${newUser.fullName} (${newUser.roleTier})`);
    refreshData();
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...data } : u);
    setUsers(updated);
    saveUsers(updated);
    addAuditLog('USER_UPDATED', `User ID: ${userId}`, `Updated user details.`);
    refreshData();
  };

  const toggleUserActive = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    await updateUser(userId, { active: !target.active });
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'> | string, memberIds?: string[]) => {
    let newProj: Project;
    if (typeof projectData === 'string') {
      newProj = {
        id: 'proj-' + Date.now(),
        name: projectData,
        memberIds: memberIds || [],
        active: true,
        createdAt: new Date().toISOString()
      };
    } else {
      newProj = {
        ...projectData,
        id: 'proj-' + Date.now(),
        createdAt: new Date().toISOString()
      };
    }
    const updated = [...projects, newProj];
    setProjects(updated);
    saveProjects(updated);
    addAuditLog('PROJECT_CREATED', `Project: ${newProj.name}`, `Created project ${newProj.name}`);
    refreshData();
  };

  const updateProject = async (projectId: string, data: Partial<Project>) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, ...data } : p);
    setProjects(updated);
    saveProjects(updated);
    addAuditLog('PROJECT_UPDATED', `Project ID: ${projectId}`, `Updated project details.`);
    refreshData();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      projects,
      tasks,
      meetings,
      notifications,
      auditLogs,
      chatMessages,
      attendanceRecords,
      loginAsUser,
      loginWithCredentials,
      changePassword,
      logout,
      createTask,
      updateTaskStatus,
      reviewTaskByReviewer,
      reviewTaskByAdmin,
      updateProjectDeadline,
      setProjectDeadline,
      scheduleMeeting,
      deleteMeeting,
      sendChatMessage,
      checkIn,
      checkOut,
      addUser,
      updateUser,
      toggleUserActive,
      addProject,
      updateProject,
      addAuditLog,
      refreshData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
