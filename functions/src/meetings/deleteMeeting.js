/**
 * Phase 5: deleteMeeting callable.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');

const db = getFirestore();

exports.deleteMeeting = onCall(async (req) => {
  const actor = requireRole(req.auth, ['admin', 'reviewer']);
  const { meetingId } = req.data || {};

  if (!meetingId) {
    throw new HttpsError('invalid-argument', 'meetingId required.');
  }

  const ref = db.doc(`meetings/${meetingId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Meeting ${meetingId} not found.`);
  }

  await ref.delete();
  return { id: meetingId };
});
