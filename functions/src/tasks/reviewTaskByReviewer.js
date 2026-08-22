/**
 * Phase 5: reviewTaskByReviewer callable.
 *
 * Reviewer can move a Submitted task to:
 *   - Pending Admin  (decision=approved)
 *   - In Progress    (decision=sent_back; requires remark)
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');

const db = getFirestore();

exports.reviewTaskByReviewer = onCall(async (req) => {
  const actor = requireRole(req.auth, ['reviewer', 'admin']);
  const { id, decision, remark } = req.data || {};

  if (!id || !decision || !['approved', 'sent_back'].includes(decision)) {
    throw new HttpsError('invalid-argument', 'id and decision (approved|sent_back) required.');
  }
  if (decision === 'sent_back' && !remark) {
    throw new HttpsError('invalid-argument', 'Remark is required when sending a task back.');
  }

  const ref = db.doc(`tasks/${id}`);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Task ${id} not found.`);
  }
  const task = snap.data();
  if (task.status !== 'Submitted') {
    throw new HttpsError(
      'failed-precondition',
      `Task must be in Submitted status (currently ${task.status}).`
    );
  }

  const newStatus = decision === 'approved' ? 'Pending Admin' : 'In Progress';
  const activity = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorName: actor.name,
    actorRole: actor.role,
    action: decision === 'approved' ? 'Reviewer Approved (Pending Admin)' : 'Reviewer Sent Back',
    note: remark || undefined,
  };

  await ref.update({
    status: newStatus,
    reviewerId: actor.uid,
    reviewerDecision: decision,
    reviewerRemark: remark || null,
    reviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.name,
    activityLog: FieldValue.arrayUnion(activity),
  });

  return { id };
});
