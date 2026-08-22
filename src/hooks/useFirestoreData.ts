import { useEffect, useState } from 'react';
import { queryClient } from './queryClient';
import { USE_FIRESTORE_DATA } from '@/data/firestore';
import { usersRepo } from '@/data/usersRepo';
import { projectsRepo } from '@/data/projectsRepo';
import { tasksRepo } from '@/data/tasksRepo';
import { meetingsRepo } from '@/data/meetingsRepo';
import { auditLogsRepo } from '@/data/auditLogsRepo';
import { attendanceRepo } from '@/data/attendanceRepo';
import { chatRepo } from '@/data/chatRepo';
import type {
  User,
  Project,
  Task,
  Meeting,
  SystemAuditLog,
  AttendanceRecord,
  ChatMessage,
} from '@/types';

export interface ChatChannelMeta {
  id: string;
  name: string;
  memberIds: string[];
}

/**
 * Generic live-array hook: subscribes to a Firestore repo watcher and
 * also writes into React Query cache so other consumers of the same
 * queryKey see the update.
 */
function useLiveArray<T>(
  queryKey: readonly unknown[],
  subscribe: (cb: (data: T[]) => void) => () => void
): T[] {
  const keyStr = JSON.stringify(queryKey);
  const cached = (queryClient.getQueryData<T[]>(queryKey) ?? []) as T[];
  const [data, setData] = useState<T[]>(cached);

  useEffect(() => {
    if (!USE_FIRESTORE_DATA) return;
    const unsub = subscribe((next) => {
      queryClient.setQueryData(queryKey, next);
      setData(next);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);

  return data;
}

// ────────────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────────────

export function useUsers(): User[] {
  return useLiveArray<User>(['users'], usersRepo.watchAll);
}

export function useProjects(): Project[] {
  return useLiveArray<Project>(['projects'], projectsRepo.watchAll);
}

export function useTasks(): Task[] {
  return useLiveArray<Task>(['tasks'], (cb) => tasksRepo.watchAll(cb));
}

export function useMyTasks(uid: string | null | undefined): Task[] {
  return useLiveArray<Task>(['tasks', 'mine', uid ?? 'none'], (cb) =>
    uid ? tasksRepo.watchMine(uid, cb) : () => {}
  );
}

export function useReviewableTasks(): Task[] {
  return useLiveArray<Task>(['tasks', 'reviewable'], tasksRepo.watchReviewable);
}

export function useMeetings(): Meeting[] {
  return useLiveArray<Meeting>(['meetings'], (cb) => meetingsRepo.watchAll(cb));
}

export function useMyMeetings(uid: string | null | undefined): Meeting[] {
  return useLiveArray<Meeting>(['meetings', 'mine', uid ?? 'none'], (cb) =>
    uid ? meetingsRepo.watchForUser(uid, cb) : () => {}
  );
}

export function useAuditLogs(max = 100): SystemAuditLog[] {
  return useLiveArray<SystemAuditLog>(['audit_logs', max], (cb) =>
    auditLogsRepo.watchRecent(cb, max)
  );
}

export function useTodayAttendance(
  uid: string | null | undefined
): AttendanceRecord | null {
  const today = new Date().toISOString().slice(0, 10);
  const [rec, setRec] = useState<AttendanceRecord | null>(null);
  useEffect(() => {
    if (!USE_FIRESTORE_DATA || !uid) return;
    const unsub = attendanceRepo.watchDay(uid, today, setRec);
    return unsub;
  }, [uid, today]);
  return rec;
}

export function useChatChannels(): ChatChannelMeta[] {
  return useLiveArray<ChatChannelMeta>(['chat', 'channels'], chatRepo.watchChannels);
}

export function useChannelMessages(
  channelId: string | null | undefined
): ChatMessage[] {
  return useLiveArray<ChatMessage>(['chat', 'channel', channelId ?? 'none'], (cb) =>
    channelId ? chatRepo.watchChannelMessages(channelId, cb) : () => {}
  );
}

export function useDMMessages(
  uidA: string | null,
  uidB: string | null
): ChatMessage[] {
  const dmId = uidA && uidB ? chatRepo.dmIdFor(uidA, uidB) : null;
  return useLiveArray<ChatMessage>(['chat', 'dm', dmId ?? 'none'], (cb) =>
    dmId ? chatRepo.watchDM(dmId, cb) : () => {}
  );
}
