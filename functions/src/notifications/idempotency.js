/**
 * Phase 9: Email idempotency.
 *
 * Firebase retries triggers on transient failure. Without dedupe, the
 * same status transition could email a user twice. The notification_log
 * collection holds a unique doc per (eventType, entityId, decisionKey);
 * `alreadySent()` returns true if we've sent before.
 *
 * firestore.rules: notification_log is server-only writes.
 */
const admin = require('firebase-admin');

const db = admin.firestore();

async function alreadySent(eventType, entityId, decisionKey) {
  const id = `${eventType}__${entityId}__${decisionKey}`;
  const ref = db.collection('notification_log').doc(id);
  try {
    await ref.create({
      eventType,
      entityId,
      decisionKey,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return false; // first time
  } catch (err) {
    if (err.code === 6 /* ALREADY_EXISTS */) return true;
    // If we can't write the log, fall through and send (avoid losing mail).
    console.warn('[idempotency] log write failed; sending anyway.', err.message);
    return false;
  }
}

module.exports = { alreadySent };