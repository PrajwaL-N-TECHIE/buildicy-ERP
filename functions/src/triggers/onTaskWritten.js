/**
 * Trigger: tasks/{taskId} → dispatch Resend email on transitions.
 * Phase 9: idempotent via notification_log.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { taskAssigned } = require('../mail/templates/taskAssigned');
const { taskSentBack } = require('../mail/templates/taskSentBack');
const { taskReviewerApproved } = require('../mail/templates/taskReviewerApproved');
const { taskAdminApproved } = require('../mail/templates/taskAdminApproved');
const { alreadySent } = require('../notifications/idempotency');

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

async function loadAdmins() {
  const snap = await db.collection('users').where('roleTier', '==', 'admin').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function decisionKey(after) {
  // updatedAt is a serverTimestamp; .toMillis() returns epoch ms — stable per write.
  const ts = after.updatedAt?.toMillis ? after.updatedAt.toMillis() : Date.now();
  return String(ts);
}

exports.onTaskWritten = functions.firestore
  .document('tasks/{taskId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;

    const taskId = context.params.taskId;
    const [contributor, assigner, project] = await Promise.all([
      loadUser(after.contributorId),
      loadUser(after.assignedBy),
      loadProject(after.projectId),
    ]);

    if (!before && after.assignedBy) {
      const key = decisionKey(after);
      if (!(await alreadySent('TASK_ASSIGNED', taskId, key))) {
        await taskAssigned(after, contributor, assigner, project);
      }
    }

    if (before && before.status !== after.status) {
      const key = decisionKey(after);
      if (
        after.status === 'In Progress' &&
        (after.reviewerDecision === 'sent_back' || after.adminDecision === 'sent_back')
      ) {
        if (!(await alreadySent('TASK_SENT_BACK', taskId, key))) {
          const actor = (await loadUser(after.reviewerId)) || assigner;
          await taskSentBack(after, contributor, actor, after.adminRemark || after.reviewerRemark || '');
        }
      }
      if (after.status === 'Pending Admin') {
        if (!(await alreadySent('TASK_REVIEWER_APPROVED', taskId, key))) {
          const reviewer = await loadUser(after.reviewerId);
          const admins = await loadAdmins();
          await taskReviewerApproved(after, contributor, reviewer, admins, project);
        }
      }
      if (after.status === 'Completed') {
        if (!(await alreadySent('TASK_ADMIN_APPROVED', taskId, key))) {
          const adminUser = await loadUser(after.adminId);
          await taskAdminApproved(after, contributor, adminUser, after.adminRemark);
        }
      }
    }

    return null;
  });