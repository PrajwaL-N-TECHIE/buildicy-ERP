import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  AttendanceRecord,
  RoleTier,
} from '@/types';
import { todayIso } from '@/lib/date';
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
} from '@/firebase/config';
import { writeThrough } from '@/data/localStorageMirror';
import {
  signInWithCredentials,
  signInWithGoogleAuth,
  signOutCurrent,
  subscribeToAuthChanges,
  refreshTokenAndClaims,
  buildUserProfileFromAuth,
} from '@/auth/firebaseAuth';
import { updatePassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import {
  notifyTaskAssigned,
  notifyTaskSentBack,
  notifyTaskApprovedByReviewer,
  notifyTaskFinalApproved,
  notifyProjectDeadlineChanged,
  notifyMeetingScheduled,
  notifyTaskDeleted,
  sendBirthdayWishEmail,
} from '@/firebase/notifications';

import { USE_FIRESTORE_DATA } from '@/data/firestore';
import { usersRepo } from '@/data/usersRepo';
import { projectsRepo } from '@/data/projectsRepo';
import { tasksRepo } from '@/data/tasksRepo';
import { meetingsRepo } from '@/data/meetingsRepo';
import { auditLogsRepo } from '@/data/auditLogsRepo';
import { chatRepo } from '@/data/chatRepo';

const USE_FIREBASE_AUTH = import.meta.env.VITE_USE_FIREBASE_AUTH === 'true';

interface AuthContextType {
  // Identity
  currentUser: User | null;
  roleTier: RoleTier | null;
  authLoading: boolean;

  // Data (still LS-backed during Phase 1; Phase 2 swaps to Firestore)
  users: User[];
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  notifications: MailNotification[];
  auditLogs: SystemAuditLog[];
  chatMessages: ChatMessage[];
  attendanceRecords: AttendanceRecord[];

  // Auth actions
  loginWithCredentials: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginAsUser: (userId: string) => void;
  changePassword: (newPass: string) => Promise<void>;
  logout: () => Promise<void>;

  // Domain mutations (unchanged surface; Phase 5 routes them through CF)
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
  deleteTask: (taskId: string) => Promise<void>;
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
  deleteChatMessage: (messageId: string) => Promise<void>;
  markMessagesAsSeen: (messageIds: string[]) => void;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  toggleUserActive: (userId: string) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'> | string, memberIds?: string[]) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addAuditLog: (action: string, target: string, details: string) => void;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const todayStr = () => new Date().toISOString().slice(0, 10);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<MailNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const local = localStorage.getItem('erp_chat_messages');
    return local ? JSON.parse(local) : [];
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const local = localStorage.getItem('erp_attendance_records');
    return local ? JSON.parse(local) : [];
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentAuthEmail, setCurrentAuthEmail] = useState<string | null>(null);
  const [roleTier, setRoleTier] = useState<RoleTier | null>(null);
  const [fbUserProfile, setFbUserProfile] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const refreshData = () => {
    setUsers(getStoredUsers());
    setProjects(getStoredProjects());
    setTasks(getStoredTasks());
    setMeetings(getStoredMeetings());
    setNotifications(getStoredNotifications());
    setAuditLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    if (USE_FIRESTORE_DATA) {
      if (USE_FIREBASE_AUTH && !currentUserId) {
        setUsers([]);
        setProjects([]);
        setTasks([]);
        setMeetings([]);
        setAuditLogs([]);
        return;
      }

      // Clear legacy localStorage cache keys for core synced entity tables
      localStorage.removeItem('erp_users');
      localStorage.removeItem('erp_projects');
      localStorage.removeItem('erp_tasks');
      localStorage.removeItem('erp_meetings');
      localStorage.removeItem('erp_notifications');
      localStorage.removeItem('erp_audit_logs');

      const unsubUsers = usersRepo.watchAll((nextUsers) => {
        setUsers(nextUsers);
      });
      const unsubProjects = projectsRepo.watchAll((nextProjects) => {
        setProjects(nextProjects);
      });
      const unsubTasks = tasksRepo.watchAll((nextTasks) => {
        setTasks(nextTasks);
      });
      const unsubMeetings = meetingsRepo.watchAll((nextMeetings) => {
        setMeetings(nextMeetings);
      });
      const unsubLogs = auditLogsRepo.watchRecent((nextLogs) => {
        setAuditLogs(nextLogs);
      });

      return () => {
        unsubUsers();
        unsubProjects();
        unsubTasks();
        unsubMeetings();
        unsubLogs();
      };
    } else {
      refreshData();
    }
  }, [currentUserId]);

  // Automated 12 AM / Daily Birthday Check Engine
  useEffect(() => {
    if (!users || users.length === 0) return;

    const checkBirthdays = () => {
      const today = new Date();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const dayStr = String(today.getDate()).padStart(2, '0');
      const todayMonthDay = `${monthStr}-${dayStr}`;
      const todayIsoStr = todayIso();

      users.forEach(u => {
        if (!u.dob) return;
        let dobMonthDay = '';
        if (u.dob.includes('-')) {
          const parts = u.dob.split('-');
          if (parts.length === 3) {
            dobMonthDay = `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        } else if (u.dob.includes('/')) {
          const parts = u.dob.split('/');
          if (parts.length === 3) {
            dobMonthDay = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }

        if (dobMonthDay && dobMonthDay === todayMonthDay) {
          const sentKey = `erp_bday_sent_${u.id}_${todayIsoStr}`;
          if (!localStorage.getItem(sentKey)) {
            console.log(`[Birthday Engine] Today is ${u.fullName}'s Birthday! Dispatching automated wish email.`);
            sendBirthdayWishEmail(u);
            localStorage.setItem(sentKey, 'true');
          }
        }
      });
    };

    checkBirthdays();

    // Schedule check for next 12 AM midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      checkBirthdays();
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [users]);

  // Auth subscription: real Firebase Auth in prod, LS persona in dev fallback.
  useEffect(() => {
    let unsubscribe = () => {};

    const init = async () => {
      if (!USE_FIREBASE_AUTH) {
        // Legacy persona switcher. Gated by env (R8 mitigation).
        const stored = localStorage.getItem('erp_active_user_id');
        if (stored) setCurrentUserId(stored);
        else setCurrentUserId('user-1');
        setAuthLoading(false);
        return;
      }

      unsubscribe = subscribeToAuthChanges(async (fbUser) => {
        if (!fbUser) {
          setCurrentUserId(null);
          setCurrentAuthEmail(null);
          setRoleTier(null);
          setFbUserProfile(null);
          setAuthLoading(false);
          return;
        }
        setAuthLoading(true);
        setCurrentAuthEmail(fbUser.email || null);
        try {
          const { roleTier: rt, user } = await refreshTokenAndClaims();
          if (user) {
            setCurrentUserId(user.id);
            setFbUserProfile(user);
          } else {
            const fallback = buildUserProfileFromAuth(fbUser, rt);
            setCurrentUserId(fbUser.uid);
            setFbUserProfile(fallback);
          }
          setRoleTier(rt);
        } catch (err) {
          console.warn('[AuthContext] Auth state refresh fallback:', err);
          const fallback = buildUserProfileFromAuth(fbUser, 'contributor');
          setCurrentUserId(fbUser.uid);
          setFbUserProfile(fallback);
        } finally {
          setAuthLoading(false);
        }
      });
    };

    init();
    return () => unsubscribe();
  }, []);

  const currentUser = useMemo(() => {
    if (!currentUserId && !currentAuthEmail) return null;
    const found = users.find(
      (u) =>
        u.id === currentUserId ||
        (currentAuthEmail && u.email.toLowerCase() === currentAuthEmail.toLowerCase())
    );
    if (found) return found;
    if (fbUserProfile) return fbUserProfile;
    return null;
  }, [users, currentUserId, currentAuthEmail, fbUserProfile]);

  const loginAsUser = (userId: string) => {
    if (USE_FIREBASE_AUTH) {
      console.warn('loginAsUser disabled: VITE_USE_FIREBASE_AUTH=true. Use real credentials.');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    setCurrentUserId(userId);
    localStorage.setItem('erp_active_user_id', userId);
    if (currentUser && currentUser.id !== userId) {
      addAuditLog('PERSONA_SWITCHED', `User: ${targetUser.fullName}`,
        `Session persona switched to ${targetUser.fullName} (${targetUser.roleTier}).`);
    }
  };

  const loginWithCredentials = async (email: string, pass: string): Promise<boolean> => {
    if (!USE_FIREBASE_AUTH) {
      // Legacy plaintext path (Phase 1 only, gated by env flag).
      const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!targetUser) return false;
      let expected = targetUser.password;
      if (!expected) {
        if (targetUser.roleTier === 'admin') expected = 'admin@123';
        else if (targetUser.roleTier === 'reviewer') expected = 'reviewer@123';
        else expected = 'intern@123';
      }
      if (pass === expected) {
        setCurrentUserId(targetUser.id);
        localStorage.setItem('erp_active_user_id', targetUser.id);
        addAuditLog('USER_LOGGED_IN', `User: ${targetUser.fullName}`, `Authenticated with email ${email}`);
        return true;
      }
      return false;
    }

    try {
      const { user, roleTier: rt } = await signInWithCredentials(email, pass);
      setCurrentUserId(user.id);
      setRoleTier(rt);
      addAuditLog('USER_LOGGED_IN', `User: ${user.fullName}`, `Authenticated with email ${email}`);
      return true;
    } catch (err) {
      console.error('signIn failed:', err);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const { user, roleTier: rt } = await signInWithGoogleAuth();
      setCurrentUserId(user.id);
      setRoleTier(rt);
      addAuditLog('USER_LOGGED_IN', `User: ${user.fullName}`, `Authenticated with Google Sign-In (${user.email})`);
      return true;
    } catch (err) {
      console.error('Google sign-in failed:', err);
      throw err;
    }
  };

  const changePassword = async (newPass: string) => {
    if (USE_FIREBASE_AUTH) {
      if (!auth.currentUser) throw new Error('Not signed in.');
      await updatePassword(auth.currentUser, newPass);
      addAuditLog('PASSWORD_CHANGED', `User: ${currentUser?.fullName || 'unknown'}`, `Updated account password via Firebase Auth.`);
      return;
    }
    if (!currentUser) return;
    await updateUser(currentUser.id, { password: newPass });
    addAuditLog('PASSWORD_CHANGED', `User: ${currentUser.fullName}`, `Updated account password.`);
  };

  const logout = async () => {
    if (USE_FIREBASE_AUTH) {
      await signOutCurrent();
    } else {
      localStorage.removeItem('erp_active_user_id');
    }
    setCurrentUserId(null);
    setRoleTier(null);
    window.location.reload();
  };

  // ───── Domain mutations (Phase 1: unchanged, LS-backed) ─────

  const sendChatMessage = async (data: { text: string; channelId?: string | null; recipientId?: string | null }) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      channelId: data.channelId || null,
      recipientId: data.recipientId || null,
      text: data.text,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
    };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem('erp_chat_messages', JSON.stringify(updated));

    if (USE_FIRESTORE_DATA) {
      try {
        if (data.recipientId) {
          const dmId = chatRepo.dmIdFor(currentUser.id, data.recipientId);
          await chatRepo.sendDM(dmId, {
            senderId: currentUser.id,
            channelId: null,
            recipientId: data.recipientId,
            text: data.text,
            readBy: [currentUser.id],
          });
        } else if (data.channelId) {
          await chatRepo.sendChannelMessage(data.channelId, {
            senderId: currentUser.id,
            channelId: data.channelId,
            recipientId: null,
            text: data.text,
            readBy: [currentUser.id],
          });
        }
      } catch (err) {
        console.warn('[AuthContext] Firestore chat sync notice:', err);
      }
    }
  };

  const markMessagesAsSeen = (messageIds: string[]) => {
    if (!currentUser || messageIds.length === 0) return;
    let updatedAny = false;
    const updated = chatMessages.map((m) => {
      if (messageIds.includes(m.id)) {
        const currentReadBy = m.readBy || [m.senderId];
        if (!currentReadBy.includes(currentUser.id)) {
          updatedAny = true;
          return { ...m, readBy: [...currentReadBy, currentUser.id] };
        }
      }
      return m;
    });
    if (updatedAny) {
      setChatMessages(updated);
      localStorage.setItem('erp_chat_messages', JSON.stringify(updated));
    }
  };

  const deleteChatMessage = async (messageId: string) => {
    if (!currentUser) return;
    const target = chatMessages.find((m) => m.id === messageId);
    if (!target) return;

    const originalText = target.originalText || target.text;
    const updated = chatMessages.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.id,
          originalText,
          text: '[Message deleted by user]',
        };
      }
      return m;
    });

    setChatMessages(updated);
    localStorage.setItem('erp_chat_messages', JSON.stringify(updated));

    if (USE_FIRESTORE_DATA) {
      try {
        await chatRepo.updateMessage(messageId, {
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser.id,
          originalText,
          text: '[Message deleted by user]',
        });
      } catch (err) {
        console.warn('[AuthContext] Firestore deleteChatMessage error:', err);
      }
    }

    addAuditLog(
      'CHAT_MESSAGE_DELETED',
      `Deleted message by ${currentUser.fullName}`,
      `Original text: "${originalText}". Target: ${
        target.channelId || `DM:${target.recipientId}`
      }.`
    );

    refreshData();
  };

  const checkIn = async () => {
    if (!currentUser) return;
    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = todayStr();

    const existing = attendanceRecords.find(r => r.userId === currentUser.id && r.date === today);
    const newSession = {
      id: 'sess-' + Date.now(),
      checkInTime: nowTimeStr,
      sessionStartTimestamp: now.toISOString(),
    };

    let updatedRecords: AttendanceRecord[];
    if (existing) {
      updatedRecords = attendanceRecords.map(r =>
        r.id === existing.id
          ? { ...r, sessions: [...(r.sessions || []), newSession], status: 'checked_in' as const }
          : r
      );
    } else {
      updatedRecords = [
        {
          id: 'att-' + Date.now(),
          userId: currentUser.id,
          date: today,
          sessions: [newSession],
          totalWorkedHoursToday: 0,
          status: 'checked_in' as const,
        },
        ...attendanceRecords,
      ];
    }
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('erp_attendance_records', JSON.stringify(updatedRecords));
    addAuditLog('INTERN_CHECKED_IN', `User: ${currentUser.fullName}`, `Checked in for flexible session at ${nowTimeStr}`);
  };

  const checkOut = async () => {
    if (!currentUser) return;
    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = todayStr();

    const existing = attendanceRecords.find(r => r.userId === currentUser.id && r.date === today);
    if (!existing) return;

    const updatedSessions = (existing.sessions || []).map(sess => {
      if (!sess.checkOutTime) {
        const startTime = new Date(sess.sessionStartTimestamp).getTime();
        const durationHrs = Math.max(0.1, parseFloat(((now.getTime() - startTime) / (1000 * 3600)).toFixed(2)));
        return {
          ...sess,
          checkOutTime: nowTimeStr,
          sessionEndTimestamp: now.toISOString(),
          durationHours: durationHrs,
        };
      }
      return sess;
    });

    const sumTotalHours = updatedSessions.reduce((sum, s) => sum + (s.durationHours || 0), 0);

    const updatedRecord: AttendanceRecord = {
      ...existing,
      sessions: updatedSessions,
      totalWorkedHoursToday: parseFloat(sumTotalHours.toFixed(2)),
      status: 'checked_out',
    };

    const updatedRecords = attendanceRecords.map(r => r.id === existing.id ? updatedRecord : r);
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('erp_attendance_records', JSON.stringify(updatedRecords));
    addAuditLog('INTERN_CHECKED_OUT', `User: ${currentUser.fullName}`,
      `Checked out session at ${nowTimeStr}. Total today: ${sumTotalHours.toFixed(2)} hrs`);
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
      details,
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveAuditLogs(updated);
  };

  const updateProjectDeadline = async (projectId: string, dueDate: string, note: string) => {
    if (!currentUser) return;
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const updatedProj: Project = {
      ...proj,
      deadline: { dueDate, note, setBy: currentUser.id, setAt: new Date().toISOString() },
    };
    const updatedList = projects.map(p => p.id === projectId ? updatedProj : p);
    setProjects(updatedList);
    saveProjects(updatedList);

    const projMembers = users.filter(u => proj.memberIds.includes(u.id));
    await notifyProjectDeadlineChanged(updatedProj, projMembers, currentUser, dueDate, note);
    addAuditLog('PROJECT_DEADLINE_UPDATED', `Project: ${proj.name}`,
      `Target due date set to ${dueDate}. Note: ${note || 'N/A'}`);
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
      action: isSelfLogged
        ? 'Created task (Self-logged)'
        : `Assigned task to ${users.find(u => u.id === data.contributorId)?.fullName}`,
    };

    const newTask: Task = {
      id: 'task-' + Date.now(),
      contributorId: data.contributorId,
      assignedBy: isSelfLogged ? null : currentUser.id,
      projectId: data.projectId,
      taskDate: todayStr(),
      dueDate: data.dueDate || null,
      deliverableUrl: data.deliverableUrl || null,
      checklist: data.checklist || [],
      description: data.description,
      hours: data.hours,
      priority: data.priority || 'medium',
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityLog: [initialActivity],
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    if (USE_FIRESTORE_DATA) {
      try {
        await setDoc(doc(db, 'tasks', newTask.id), newTask);
      } catch (err) {
        console.warn('[AuthContext] Firestore createTask error:', err);
      }
    }

    const assignee = users.find(u => u.id === data.contributorId);
    const proj = projects.find(p => p.id === data.projectId);
    if (!isSelfLogged && assignee && proj) {
      await notifyTaskAssigned(newTask, assignee, currentUser, proj);
    }

    addAuditLog(isSelfLogged ? 'TASK_LOGGED' : 'TASK_ASSIGNED',
      `Task: ${data.description.substring(0, 30)}...`,
      `Logged ${data.hours} hrs for ${proj?.name || 'General'}. Priority: ${data.priority || 'medium'}.`);
    refreshData();
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    if (USE_FIRESTORE_DATA) {
      await tasksRepo.delete(taskId);
    } else {
      const updated = tasks.filter((t) => t.id !== taskId);
      setTasks(updated);
      saveTasks(updated);
    }

    const contributor = users.find((u) => u.id === targetTask.contributorId);
    const proj = projects.find((p) => p.id === targetTask.projectId);

    if (contributor) {
      await notifyTaskDeleted(targetTask, contributor, currentUser, proj);
    }

    addAuditLog(
      'TASK_DELETED',
      `Deleted Task: ${targetTask.description.substring(0, 30)}...`,
      `Deleted by ${currentUser.fullName} (${currentUser.roleTier}).`
    );
    refreshData();
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!currentUser) return;
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const activity: ActivityLogEntry = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action: `Status changed to ${status}`,
    };
    const updated: Task = {
      ...target,
      status,
      updatedAt: new Date().toISOString(),
      activityLog: [activity, ...(target.activityLog || [])],
    };
    setTasks(tasks.map(t => t.id === taskId ? updated : t));
    saveTasks(tasks.map(t => t.id === taskId ? updated : t));

    if (USE_FIRESTORE_DATA) {
      try {
        await tasksRepo.update(taskId, updated);
      } catch (err) {
        console.warn('[AuthContext] Firestore updateTaskStatus error:', err);
      }
    }

    addAuditLog('TASK_STATUS_UPDATED', `Task: ${target.description.substring(0, 30)}...`,
      `Status updated from ${target.status} to ${status}`);
    refreshData();
  };

  const reviewTaskByReviewer = async (taskId: string, decision: 'approved' | 'sent_back', remark: string) => {
    if (!currentUser) return;
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const isApprove = decision === 'approved';
    const newStatus: TaskStatus = isApprove ? 'Pending Admin' : 'In Progress';
    const activity: ActivityLogEntry = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action: isApprove ? 'Reviewer Approved (Moved to Pending Admin)' : 'Reviewer Sent Back for Revisions',
      note: remark || undefined,
    };
    const updated: Task = {
      ...target,
      status: newStatus,
      reviewerId: currentUser.id,
      reviewerDecision: decision,
      reviewerRemark: remark,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activityLog: [activity, ...(target.activityLog || [])],
    };
    setTasks(tasks.map(t => t.id === taskId ? updated : t));
    saveTasks(tasks.map(t => t.id === taskId ? updated : t));

    if (USE_FIRESTORE_DATA) {
      try {
        await tasksRepo.update(taskId, updated);
      } catch (err) {
        console.warn('[AuthContext] Firestore reviewTaskByReviewer error:', err);
      }
    }

    const contributor = users.find(u => u.id === target.contributorId);
    const proj = projects.find(p => p.id === target.projectId);
    if (isApprove) {
      const admins = users.filter(u => u.roleTier === 'admin');
      if (contributor && proj) await notifyTaskApprovedByReviewer(updated, contributor, currentUser, admins, proj);
    } else {
      if (contributor) await notifyTaskSentBack(updated, contributor, currentUser, remark);
    }
    addAuditLog(isApprove ? 'REVIEWER_APPROVED' : 'REVIEWER_SENT_BACK',
      `Task: ${target.description.substring(0, 30)}...`, `Remark: ${remark || 'None'}`);
    refreshData();
  };

  const reviewTaskByAdmin = async (taskId: string, decision: 'approved' | 'sent_back', remark: string) => {
    if (!currentUser) return;
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const isApprove = decision === 'approved';
    const newStatus: TaskStatus = isApprove ? 'Completed' : 'In Progress';
    const activity: ActivityLogEntry = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      actorName: currentUser.fullName,
      actorRole: currentUser.roleTier,
      action: isApprove ? 'Final Admin Approved (Completed)' : 'Admin Sent Back for Revisions',
      note: remark || undefined,
    };
    const updated: Task = {
      ...target,
      status: newStatus,
      adminId: currentUser.id,
      adminDecision: decision,
      adminRemark: remark,
      approvedAt: isApprove ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
      activityLog: [activity, ...(target.activityLog || [])],
    };
    setTasks(tasks.map(t => t.id === taskId ? updated : t));
    saveTasks(tasks.map(t => t.id === taskId ? updated : t));

    if (USE_FIRESTORE_DATA) {
      try {
        await tasksRepo.update(taskId, updated);
      } catch (err) {
        console.warn('[AuthContext] Firestore reviewTaskByAdmin error:', err);
      }
    }

    const contributor = users.find(u => u.id === target.contributorId);
    if (isApprove && contributor) {
      await notifyTaskFinalApproved(updated, contributor, currentUser, remark);
    } else if (!isApprove && contributor) {
      await notifyTaskSentBack(updated, contributor, currentUser, remark);
    }
    addAuditLog(isApprove ? 'ADMIN_FINAL_APPROVED' : 'ADMIN_SENT_BACK',
      `Task: ${target.description.substring(0, 30)}...`, `Remark: ${remark || 'None'}`);
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
      createdAt: new Date().toISOString(),
    };

    const updatedMeetings = [newMeeting, ...meetings];
    setMeetings(updatedMeetings);
    saveMeetings(updatedMeetings);

    const participants = users.filter(u => data.participantIds.includes(u.id));
    const proj = data.projectId ? projects.find(p => p.id === data.projectId) : null;
    await notifyMeetingScheduled(newMeeting, participants, currentUser, proj);

    addAuditLog('MEETING_SCHEDULED', `Meeting: ${data.title}`,
      `Scheduled for ${new Date(data.scheduledAt).toLocaleString()} with ${data.participantIds.length} attendees`);
    refreshData();
  };

  const deleteMeeting = async (meetingId: string) => {
    if (!currentUser) return;
    const target = meetings.find(m => m.id === meetingId);
    if (!target) return;

    const updated = meetings.filter(m => m.id !== meetingId);
    setMeetings(updated);
    saveMeetings(updated);

    addAuditLog('MEETING_DELETED', `Meeting: ${target.title}`,
      `Cancelled and deleted by ${currentUser.fullName} (${currentUser.roleTier})`);
    refreshData();
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: 'user-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    addAuditLog('USER_CREATED', `User: ${newUser.fullName}`,
      `Created user ${newUser.fullName} (${newUser.roleTier})`);
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
        createdAt: new Date().toISOString(),
      };
    } else {
      newProj = { ...projectData, id: 'proj-' + Date.now(), createdAt: new Date().toISOString() };
    }
    const updated = [...projects, newProj];
    setProjects(updated);
    saveProjects(updated);

    if (USE_FIRESTORE_DATA) {
      try {
        await setDoc(doc(db, 'projects', newProj.id), newProj);
      } catch (err) {
        console.warn('[AuthContext] Firestore addProject error:', err);
      }
    }

    addAuditLog('PROJECT_CREATED', `Project: ${newProj.name}`, `Created project ${newProj.name}`);
    refreshData();
  };

  const updateProject = async (projectId: string, data: Partial<Project>) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, ...data } : p);
    setProjects(updated);
    saveProjects(updated);

    if (USE_FIRESTORE_DATA) {
      try {
        await projectsRepo.update(projectId, data);
      } catch (err) {
        console.warn('[AuthContext] Firestore updateProject error:', err);
      }
    }

    addAuditLog('PROJECT_UPDATED', `Project ID: ${projectId}`, `Updated project details.`);
    refreshData();
  };

  const deleteProject = async (projectId: string) => {
    if (!currentUser) return;
    const target = projects.find(p => p.id === projectId);
    if (!target) return;

    if (USE_FIRESTORE_DATA) {
      try {
        await projectsRepo.delete(projectId);
      } catch (err) {
        console.warn('[AuthContext] Firestore deleteProject error:', err);
      }
    } else {
      const updated = projects.filter(p => p.id !== projectId);
      setProjects(updated);
      saveProjects(updated);
    }

    addAuditLog('PROJECT_DELETED', `Project: ${target.name}`, `Deleted project "${target.name}" permanently from directory.`);
    refreshData();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      roleTier,
      authLoading,
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
      loginWithGoogle,
      changePassword,
      logout,
      createTask,
      deleteTask,
      updateTaskStatus,
      reviewTaskByReviewer,
      reviewTaskByAdmin,
      updateProjectDeadline,
      setProjectDeadline,
      scheduleMeeting,
      deleteMeeting,
      sendChatMessage,
      deleteChatMessage,
      markMessagesAsSeen,
      checkIn,
      checkOut,
      addUser,
      updateUser,
      toggleUserActive,
      addProject,
      updateProject,
      deleteProject,
      addAuditLog,
      refreshData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('[AuthContext] useAuth invoked outside AuthProvider during reload/HMR, returning fallback.');
    return {} as AuthContextType;
  }
  return context;
};