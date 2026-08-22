/**
 * Phase 5: createTask callable.
 *
 * Validates RBAC and writes a new task. Replaces direct client writes
 * to /tasks. SPA only writes through cf.createTask() when
 * VITE_USE_CF_WRITES=true.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { requireAuth, requireRole } = require('../auth');

const db = getFirestore();

exports.createTask = onCall(async (req) => {
  const actor = requireRole(req.auth, ['admin', 'reviewer', 'contributor']);
  const data = req.data || {};

  const { contributorId, projectId, description, hours, priority, dueDate, deliverableUrl, checklist } = data;

  if (!contributorId || !projectId || !description) {
    throw new HttpsError('invalid-argument', 'contributorId, projectId, description required.');
  }

  const contributor = await db.doc(`users/${contributorId}`).get();
  if (!contributor.exists) {
    throw new HttpsError('not-found', `Contributor ${contributorId} not found.`);
  }
  const contributorRole = contributor.get('roleTier');

  // Contributors may only log tasks for themselves and with no assigner.
  if (actor.role === 'contributor') {
    if (contributorId !== actor.uid) {
      throw new HttpsError('permission-denied', 'Contributors can only self-log.');
    }
    if (data.assignedBy) {
      throw new HttpsError('permission-denied', 'Contributors cannot set assignedBy.');
    }
  }

  // Reviewers may only assign to contributors.
  if (actor.role === 'reviewer' && contributorRole !== 'contributor') {
    throw new HttpsError('permission-denied', 'Reviewers can only assign tasks to contributors.');
  }

  const task = {
    contributorId,
    projectId,
    description,
    hours: Number(hours) || 0,
    priority: priority || 'medium',
    dueDate: dueDate || null,
    deliverableUrl: deliverableUrl || null,
    checklist: Array.isArray(checklist) ? checklist : [],
    assignedBy: data.assignedBy || null,
    status: 'Not Started',
    taskDate: new Date().toISOString().slice(0, 10),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
    updatedByName: actor.name,
    activityLog: [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: actor.name,
        actorRole: actor.role,
        action: data.assignedBy ? 'Assigned task' : 'Created task (self-logged)',
      },
    ],
  };

  const ref = await db.collection('tasks').add(task);
  return { id: ref.id };
});
