/**
 * Phase 5: updateTaskStatus callable.
 *
 * Validates the state-machine transition for the actor's role.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');
const { canTransition } = require('./stateMachine');

const db = getFirestore();

exports.updateTaskStatus = onCall(async (req) => {
  const actor = requireRole(req.auth, ['admin', 'reviewer', 'contributor']);
  const { id, status } = req.data || {};
  if (!id || !status) {
    throw new HttpsError('invalid-argument', 'id and status are required.');
  }

  const ref = db.doc(`tasks/${id}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Task ${id} not found.`);
  }
  const task = snap.data();
  const currentStatus = task.status;

  // Contributors can only update their own tasks.
  if (actor.role === 'contributor' && task.contributorId !== actor.uid) {
    throw new HttpsError('permission-denied', 'Contributors can only update their own tasks.');
  }

  if (!canTransition(currentStatus, status, actor.role)) {
    throw new HttpsError(
      'failed-precondition',
      `Illegal transition ${currentStatus} → ${status} for role ${actor.role}.`
    );
  }

  const activity = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorName: actor.name,
    actorRole: actor.role,
    action: `Status changed to ${status}`,
  };

  await ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.name,
    activityLog: FieldValue.arrayUnion(activity),
  });

  return { id };
});
