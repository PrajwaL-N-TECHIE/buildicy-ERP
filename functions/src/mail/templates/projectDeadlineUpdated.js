const { sendEmail } = require('../resendClient');

/**
 * Notify all project members when a project deadline changes.
 */
async function projectDeadlineUpdated(project, members = [], setBy, dueDate, note) {
  const emails = members.map((m) => m.email).filter(Boolean);
  if (emails.length === 0) return;
  const subject = `[Project Deadline] ${project.name} target updated`;
  const text = [
    `Hi team,`,
    '',
    `${setBy?.fullName || 'A project owner'} updated the deadline for project "${project.name}".`,
    '',
    `New target: ${dueDate || project.deadline?.dueDate || 'TBD'}`,
    note || project.deadline?.note ? `Note: ${note || project.deadline?.note}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const html = `
    <p>Hi team,</p>
    <p><strong>${setBy?.fullName || 'A project owner'}</strong> updated the deadline for project <strong>${
    project.name
  }</strong>.</p>
    <p><strong>New target:</strong> ${dueDate || project.deadline?.dueDate || 'TBD'}</p>
    ${note || project.deadline?.note ? `<p><strong>Note:</strong> ${note || project.deadline?.note}</p>` : ''}
  `;
  return sendEmail({
    to: emails,
    subject,
    text,
    html,
    metadata: { event: 'PROJECT_DEADLINE_UPDATED', projectId: project.id },
  });
}

module.exports = { projectDeadlineUpdated };
