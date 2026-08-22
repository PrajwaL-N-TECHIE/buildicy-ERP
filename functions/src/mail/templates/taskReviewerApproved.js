const { sendEmail } = require('../resendClient');

/**
 * Notify admins (the founder approval queue) that a task has been
 * reviewer-approved and is awaiting final sign-off.
 */
async function taskReviewerApproved(task, contributor, reviewer, admins = [], project) {
  const adminEmails = admins.map((a) => a.email).filter(Boolean);
  if (adminEmails.length === 0) return;
  const subject = `[Approval Queue] Task awaiting admin sign-off`;
  const text = [
    `A task has been approved by the reviewer and is pending admin sign-off.`,
    '',
    `Task: ${task.description}`,
    `Contributor: ${contributor?.fullName || task.contributorId}`,
    `Reviewer: ${reviewer?.fullName || task.reviewerId}`,
    project?.name ? `Project: ${project.name}` : null,
    '',
    'Open the Buildicy ERP admin queue to review and approve.',
  ]
    .filter(Boolean)
    .join('\n');
  const html = `
    <p>A task has been approved by the reviewer and is pending admin sign-off.</p>
    <p><strong>Task:</strong> ${task.description}</p>
    <p><strong>Contributor:</strong> ${contributor?.fullName || task.contributorId}</p>
    <p><strong>Reviewer:</strong> ${reviewer?.fullName || task.reviewerId}</p>
    ${project?.name ? `<p><strong>Project:</strong> ${project.name}</p>` : ''}
    <p>Open the Buildicy ERP admin queue to review and approve.</p>
  `;
  return sendEmail({
    to: adminEmails,
    subject,
    text,
    html,
    metadata: { event: 'TASK_REVIEWER_APPROVED', taskId: task.id },
  });
}

module.exports = { taskReviewerApproved };
