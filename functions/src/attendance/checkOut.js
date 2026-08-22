/**
 * Phase 5: checkOut callable.
 *
 * Closes the most-recent open session for the user on today's date and
 * updates totalWorkedHoursToday. Server-side math keeps duration
 * consistent across devices.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');

const db = getFirestore();

exports.checkOut = onCall(async (req) => {
  const actor = requireRole(req.auth, ['contributor']);
  const date = new Date().toISOString().slice(0, 10);
  const ref = db.doc(`attendance/users/${actor.uid}/sessions/${date}`);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError('not-found', 'No check-in record found for today.');
  }

  const data = snap.data();
  const sessions = (data.sessions || []).slice();
  let closed = false;
  let totalHours = 0;
  const now = Date.now();

  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (!s.checkOutTime) {
      const start = new Date(s.sessionStartTimestamp).getTime();
      const durationHrs = Math.max(0.1, parseFloat(((now - start) / (1000 * 3600)).toFixed(2)));
      sessions[i] = {
        ...s,
        checkOutTime: new Date().toISOString(),
        sessionEndTimestamp: new Date().toISOString(),
        durationHours: durationHrs,
      };
      closed = true;
      break;
    }
  }

  if (!closed) {
    throw new HttpsError('failed-precondition', 'No open session to close.');
  }

  totalHours = sessions.reduce((sum, s) => sum + (s.durationHours || 0), 0);

  await ref.update({
    sessions,
    status: 'checked_out',
    totalWorkedHoursToday: parseFloat(totalHours.toFixed(2)),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: `${actor.uid}/${date}` };
});
