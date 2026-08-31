import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AttendanceRecord, AttendanceSession } from '@/types';

const BASE = 'attendance/users';
const COLLECTION_PATH = 'attendance_records';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const attendanceRepo = {
  watchAllToday(date: string, cb: (records: AttendanceRecord[]) => void) {
    return onSnapshot(
      collection(db, COLLECTION_PATH),
      (snap) => {
        const records = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
        cb(records);
      },
      (err) => {
        console.warn('[attendanceRepo] watchAllToday notice:', err.message);
      }
    );
  },
  async upsertRecord(rec: AttendanceRecord) {
    try {
      await setDoc(doc(db, COLLECTION_PATH, rec.id), rec, { merge: true });
    } catch (err: any) {
      console.warn('[attendanceRepo] upsertRecord notice:', err?.message || err);
    }
  },
  watchDay(uid: string, date: string, cb: (rec: AttendanceRecord | null) => void) {
    return onSnapshot(
      doc(db, BASE, uid, 'sessions', date),
      (snap) => {
        cb(
          snap.exists()
            ? ({ id: snap.id, userId: uid, date, ...snap.data() } as AttendanceRecord)
            : null
        );
      },
      (err) => {
        console.warn('[attendanceRepo] watchDay notice:', err.message);
        cb(null);
      }
    );
  },
  async checkIn(uid: string) {
    const date = todayIso();
    const session: AttendanceSession = {
      id: 'sess-' + Date.now(),
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
  async checkOut(uid: string) {
    const date = todayIso();
    await setDoc(
      doc(db, BASE, uid, 'sessions', date),
      { status: 'checked_out' },
      { merge: true }
    );
  },
};
