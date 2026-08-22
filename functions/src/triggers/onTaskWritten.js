/**
 * Trigger: tasks/{taskId} → dispatch Resend email on transitions.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { taskAssigned } = require('../mail/templates/taskAssigned');
const { taskSentBack } = require('../mail/templates/taskSentBack');
const { taskReviewerApproved } = require('../mail/templates/taskReviewerApproved');
const { taskAdminApproved } = require('../mail/templates/taskAdminApproved');

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

exports.onTaskWritten = functions.firestore
  .document('tasks/{taskId}')
  .onWrite(async (change) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;

    const [contributor, assigner, project] = await Promise.all([
      loadUser(after.contributorId),
      loadUser(after.assignedBy),
      loadProject(after.projectId),
    ]);

    if (!before && after.assignedBy) {
      await taskAssigned(after, contributor, assigner, project);
    }

    if (before && before.status !== after.status) {
      if (
        after.status === 'In Progress' &&
        (after.reviewerDecision === 'sent_back' || after.adminDecision === 'sent_back')
      ) {
        const actor = (await loadUser(after.reviewerId)) || assigner;
        await taskSentBack(after, contributor, actor, after.adminRemark || after.reviewerRemark || '');
      }
      if (after.status === 'Pending Admin') {
        const reviewer = await loadUser(after.reviewerId);
        const admins = await loadAdmins();
        await taskReviewerApproved(after, contributor, reviewer, admins, project);
      }
      if (after.status === 'Completed') {
        const adminUser = await loadUser(after.adminId);
        await taskAdminApproved(after, contributor, adminUser, after.adminRemark);
      }
    }

    return null;
  });
