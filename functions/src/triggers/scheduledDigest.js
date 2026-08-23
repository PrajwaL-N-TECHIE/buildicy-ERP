/**
 * Phase 9: Scheduled overdue digest.
 *
 * Runs weekdays at 09:00 Asia/Kolkata. Reads all non-Completed tasks
 * with a dueDate in the past, then sends a digest to founders via the
 * Resend overdueDigest template.
 *
 * Set the schedule below to "every monday 09:00" via cron expression:
 *   "0 3 * * 1-5"  → 03:30 UTC = 09:00 IST weekdays.
 *
 * Manually trigger via:
 *   firebase functions:shell
 *   > scheduledDigest()
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { overdueDigest } = require('../mail/templates/overdueDigest');

const db = admin.firestore();

async function loadFounders() {
  const snap = await db.collection('users').where('roleTier', '==', 'admin').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadOverdueTasks() {
  const today = new Date().toISOString().slice(0, 10);
  const snap = await db
    .collection('tasks')
    .where('status', '!=', 'Completed')
    .where('dueDate', '<', today)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

exports.scheduledDigest = functions.pubsub
  .schedule('0 3 * * 1-5')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const [founders, overdue] = await Promise.all([loadFounders(), loadOverdueTasks()]);
    if (founders.length === 0 || overdue.length === 0) {
      console.log(`[digest] skipped: ${founders.length} founders, ${overdue.length} overdue`);
      return null;
    }
    await overdueDigest(founders, overdue);
    console.log(`[digest] sent ${overdue.length} overdue to ${founders.length} founders`);
    return null;
  });