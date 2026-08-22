/**
 * Phase 5: checkIn callable.
 *
 * Contributors can only check in for themselves. Admins/reviewers are
 * not subject to attendance tracking and cannot use this callable.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');

const db = getFirestore();

exports.checkIn = onCall(async (req) => {
  const actor = requireRole(req.auth, ['contributor']);
  const date = new Date().toISOString().slice(0, 10);
  const ref = db.doc(`attendance/users/${actor.uid}/sessions/${date}`);
  const session = {
    id: `sess-${Date.now()}`,
    checkInTime: new Date().toISOString(),
    sessionStartTimestamp: new Date().toISOString(),
  };

  await ref.set(
    {
      userId: actor.uid,
      date,
      status: 'checked_in',
      sessions: FieldValue.arrayUnion(session),
      totalWorkedHoursToday: 0,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { id: `${actor.uid}/${date}` };
});
