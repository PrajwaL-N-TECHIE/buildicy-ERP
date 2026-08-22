/**
 * Phase 5: reviewTaskByAdmin callable.
 *
 * Admin can move a Pending Admin task to:
 *   - Completed     (decision=approved)
 *   - In Progress   (decision=sent_back; requires remark)
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireRole } = require('../auth');

const db = getFirestore();

exports.reviewTaskByAdmin = onCall(async (req) => {
  const actor = requireRole(req.auth, ['admin']);
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
  if (task.status !== 'Pending Admin') {
    throw new HttpsError(
      'failed-precondition',
      `Task must be in Pending Admin status (currently ${task.status}).`
    );
  }

  const newStatus = decision === 'approved' ? 'Completed' : 'In Progress';
  const activity = {
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorName: actor.name,
    actorRole: actor.role,
    action: decision === 'approved' ? 'Final Admin Approved (Completed)' : 'Admin Sent Back',
    note: remark || undefined,
  };

  await ref.update({
    status: newStatus,
    adminId: actor.uid,
    adminDecision: decision,
    adminRemark: remark || null,
    approvedAt: decision === 'approved' ? FieldValue.serverTimestamp() : null,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.name,
    activityLog: FieldValue.arrayUnion(activity),
  });

  return { id };
});
