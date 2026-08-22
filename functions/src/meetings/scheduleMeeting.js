/**
 * Phase 5: scheduleMeeting callable.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');

const db = getFirestore();

exports.scheduleMeeting = onCall(async (req) => {
  const actor = requireRole(req.auth, ['admin', 'reviewer']);
  const { title, projectId, participantIds, scheduledAt, location, notes } = req.data || {};

  if (!title || !scheduledAt || !location) {
    throw new HttpsError('invalid-argument', 'title, scheduledAt, location required.');
  }
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw new HttpsError('invalid-argument', 'participantIds required.');
  }

  const meeting = {
    title,
    projectId: projectId || null,
    participantIds,
    scheduledAt,
    location,
    notes: notes || '',
    createdBy: actor.uid,
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection('meetings').add(meeting);
  return { id: ref.id };
});
