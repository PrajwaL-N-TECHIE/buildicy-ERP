const { sendEmail } = require('../resendClient');

/**
 * Notify the contributor that their task received final admin sign-off.
 */
async function taskAdminApproved(task, contributor, admin, remark) {
  if (!contributor?.email) return;
  const subject = `[Completed] Task approved — final sign-off`;
  const text = [
    `Hi ${contributor.fullName || ''},`,
    '',
    `Your task received final approval from ${admin?.fullName || 'an admin'}.`,
    '',
    `Task: ${task.description}`,
    remark ? `Remarks: ${remark}` : null,
    '',
    'Status is now Completed. Great work!',
  ]
    .filter(Boolean)
    .join('\n');
  const html = `
    <p>Hi <strong>${contributor.fullName || ''}</strong>,</p>
    <p>Your task received final approval from <strong>${admin?.fullName || 'an admin'}</strong>.</p>
    <p><strong>Task:</strong> ${task.description}</p>
    ${remark ? `<p><strong>Remarks:</strong> ${remark}</p>` : ''}
    <p>Status is now <strong>Completed</strong>. Great work!</p>
  `;
  return sendEmail({
    to: [contributor.email],
    subject,
    text,
    html,
    metadata: { event: 'TASK_ADMIN_APPROVED', taskId: task.id },
  });
}

module.exports = { taskAdminApproved };
