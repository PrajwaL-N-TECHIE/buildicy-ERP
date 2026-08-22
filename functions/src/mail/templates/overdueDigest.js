const { sendEmail } = require('../resendClient');

/**
 * Daily digest of overdue tasks, sent to founders.
 * Phase 9 wires up the scheduled trigger.
 */
async function overdueDigest(founders = [], overdueTasks = []) {
  const emails = founders.map((f) => f.email).filter(Boolean);
  if (emails.length === 0) return;
  if (overdueTasks.length === 0) return;

  const subject = `[Daily Digest] ${overdueTasks.length} overdue task${
    overdueTasks.length === 1 ? '' : 's'
  }`;
  const lines = [
    `Overdue task digest — ${new Date().toLocaleDateString()}`,
    '',
    ...overdueTasks.map(
      (t, i) =>
        `${i + 1}. ${t.description} — assigned to ${t.contributorId || '?'}, due ${
          t.dueDate || 'no date'
        }`
    ),
  ];
  const text = lines.join('\n');
  const html = `
    <p>Overdue task digest — <strong>${new Date().toLocaleDateString()}</strong></p>
    <ol>
      ${overdueTasks
        .map(
          (t) =>
            `<li>${t.description} — assigned to ${t.contributorId || '?'}, due ${
              t.dueDate || 'no date'
            }</li>`
        )
        .join('')}
    </ol>
  `;
  return sendEmail({
    to: emails,
    subject,
    text,
    html,
    metadata: { event: 'OVERDUE_DIGEST', count: String(overdueTasks.length) },
  });
}

module.exports = { overdueDigest };
