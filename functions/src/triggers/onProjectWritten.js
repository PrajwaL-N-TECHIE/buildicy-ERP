/**
 * Trigger: projects/{projectId} → notify members when deadline changes.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { projectDeadlineUpdated } = require('../mail/templates/projectDeadlineUpdated');

const db = admin.firestore();

async function loadUser(uid) {
  if (!uid) return null;
  const snap = await db.doc(`users/${uid}`).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

exports.onProjectWritten = functions.firestore
  .document('projects/{projectId}')
  .onWrite(async (change) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after || !after.deadline) return null;

    const beforeDeadline = before ? JSON.stringify(before.deadline) : null;
    if (beforeDeadline === JSON.stringify(after.deadline)) return null;

    const memberIds = after.memberIds || [];
    const members = (await Promise.all(memberIds.map((id) => loadUser(id)))).filter(Boolean);
    const setBy = await loadUser(after.deadline.setBy);

    await projectDeadlineUpdated(
      { ...after },
      members,
      setBy,
      after.deadline.dueDate,
      after.deadline.note
    );
    return null;
  });
