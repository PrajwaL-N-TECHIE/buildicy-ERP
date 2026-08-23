/**
 * Phase 8: Generic audit-log writer.
 *
 * Watches tasks / projects / meetings writes and appends an audit_logs
 * document stamped with the actor (from the doc's updatedBy field set
 * by Phase 5 callables) or 'system' as a fallback.
 *
 * The collection is server-only — see firestore.rules (audit_logs
 * allow write: if false). The SPA reads but never writes.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

const AUDITABLE = [
  { pattern: 'tasks/{taskId}', label: 'task' },
  { pattern: 'projects/{projectId}', label: 'project' },
  { pattern: 'meetings/{meetingId}', label: 'meeting' },
];

function makeAuditEntry(after, before, label, eventId) {
  const afterData = after?.data?.() || null;
  const beforeData = before?.data?.() || null;

  const actorId = afterData?.updatedBy || beforeData?.updatedBy || 'system';
  const actorName = afterData?.updatedByName || beforeData?.updatedByName || 'System';
  const actorRole = afterData?.updatedByRole || 'system';

  const verb =
    !beforeData && afterData
      ? 'CREATED'
      : beforeData && !afterData
      ? 'DELETED'
      : 'UPDATED';

  return {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorId,
    actorName,
    actorRole,
    action: `${label.toUpperCase()}_${verb}`,
    target: eventId,
    details: JSON.stringify({
      before: beforeData,
      after: afterData,
    }).slice(0, 4000),
  };
}

AUDITABLE.forEach(({ pattern, label }) => {
  const fnName = `audit_${label}`;
  exports[fnName] = functions.firestore
    .document(pattern)
    .onWrite(async (change, context) => {
      const before = change.before;
      const after = change.after;
      // Skip no-op updates.
      if (
        before.exists &&
        after.exists &&
        JSON.stringify(before.data()) === JSON.stringify(after.data())
      ) {
        return null;
      }
      const entry = makeAuditEntry(after, before, label, context.params[Object.keys(context.params)[0]]);
      await db.collection('audit_logs').add(entry);
      return null;
    });
});