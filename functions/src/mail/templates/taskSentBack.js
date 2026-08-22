const { sendEmail } = require('../resendClient');

/**
 * Notify the contributor that a reviewer or admin sent the task back
 * for revisions.
 */
async function taskSentBack(task, contributor, actor, remark) {
  if (!contributor?.email) return;
  const subject = `[Action Required] Task sent back for revisions`;
  const text = [
    `Hi ${contributor.fullName || ''},`,
    '',
    `${actor?.fullName || 'A reviewer'} sent your task back for revisions.`,
    '',
    `Task: ${task.description}`,
    remark ? `Remark: ${remark}` : 'Remark: (none provided)',
    '',
    'Please address the feedback and resubmit when ready.',
  ].join('\n');
  const html = `
    <p>Hi <strong>${contributor.fullName || ''}</strong>,</p>
    <p><strong>${actor?.fullName || 'A reviewer'}</strong> sent your task back for revisions.</p>
    <p><strong>Task:</strong> ${task.description}</p>
    <p><strong>Remark:</strong> ${remark || '(none provided)'}</p>
    <p>Please address the feedback and resubmit when ready.</p>
  `;
  return sendEmail({
    to: [contributor.email],
    subject,
    text,
    html,
    metadata: { event: 'TASK_SENT_BACK', taskId: task.id },
  });
}

module.exports = { taskSentBack };
