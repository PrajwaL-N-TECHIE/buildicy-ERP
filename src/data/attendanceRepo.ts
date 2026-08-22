import {
  arrayUnion,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AttendanceRecord, AttendanceSession } from '@/types';

const BASE = 'attendance/users';

/**
 * Phase 3 structure: attendance/{uid}/sessions/{YYYY-MM-DD}
 * One doc per user per day; multi-session support lives inside the array.
 */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const attendanceRepo = {
  watchDay(uid: string, date: string, cb: (rec: AttendanceRecord | null) => void) {
    return onSnapshot(doc(db, BASE, uid, 'sessions', date), (snap) => {
      cb(
        snap.exists()
          ? ({ id: snap.id, userId: uid, date, ...snap.data() } as AttendanceRecord)
          : null
      );
    });
  },
  async checkIn(uid: string) {
    const date = todayIso();
    const session: AttendanceSession = {
      id: 'sess-' + Date.now(),
      checkInTime: new Date().toISOString(),
      sessionStartTimestamp: new Date().toISOString(),
    };
    await setDoc(
      doc(db, BASE, uid, 'sessions', date),
      {
        userId: uid,
        date,
        status: 'checked_in',
        sessions: arrayUnion(session),
        totalWorkedHoursToday: 0,
      },
      { merge: true }
    );
  },
  /**
   * Closes the most recent open session. Phase 5 will move this to a
   * callable function so duration math happens server-side.
   */
  async checkOut(uid: string) {
    const date = todayIso();
    // For Phase 2 we just mark the day checked_out; Phase 5 closes the
    // session explicitly via callable.
    await setDoc(
      doc(db, BASE, uid, 'sessions', date),
      { status: 'checked_out' },
      { merge: true }
    );
  },
};
