/**
 * Trigger: meetings/{meetingId} → invite participants.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { meetingScheduled } = require('../mail/templates/meetingScheduled');

const db = admin.firestore();

async function loadUser(uid) {
  if (!uid) return null;
  const snap = await db.doc(`users/${uid}`).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function loadProject(pid) {
  if (!pid) return null;
  const snap = await db.doc(`projects/${pid}`).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

exports.onMeetingCreated = functions.firestore
  .document('meetings/{meetingId}')
  .onCreate(async (snap) => {
    const meeting = snap.data();
    if (!meeting || !meeting.participantIds || meeting.participantIds.length === 0) return null;

    const [organizer, project, participants] = await Promise.all([
      loadUser(meeting.createdBy),
      loadProject(meeting.projectId),
      Promise.all(meeting.participantIds.map((id) => loadUser(id))),
    ]);

    await meetingScheduled(meeting, participants.filter(Boolean), organizer, project);
    return null;
  });
