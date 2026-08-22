/**
 * Phase 5: updateProjectDeadline callable.
 *
 * Admin and reviewer can set a project deadline. Reviewer-only access is
 * enforced both here AND in firestore.rules; this is defence in depth.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');

const db = getFirestore();

exports.updateProjectDeadline = onCall(async (req) => {
  const actor = requireRole(req.auth, ['admin', 'reviewer']);
  const { projectId, dueDate, note } = req.data || {};

  if (!projectId || !dueDate) {
    throw new HttpsError('invalid-argument', 'projectId and dueDate required.');
  }

  const ref = db.doc(`projects/${projectId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Project ${projectId} not found.`);
  }

  const deadline = {
    dueDate,
    note: note || '',
    setBy: actor.uid,
    setAt: FieldValue.serverTimestamp(),
  };

  await ref.update({
    deadline,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.name,
  });

  return { id: projectId };
});
