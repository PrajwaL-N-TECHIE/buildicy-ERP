const { sendEmail } = require('../resendClient');

/**
 * Notify a contributor that a task has been assigned to them.
 */
async function taskAssigned(task, contributor, assigner, project) {
  if (!contributor?.email) return;
  const subject = `[Task Assigned] ${project?.name || 'New task'}: ${(task.description || '').slice(0, 60)}`;
  const text = [
    `Hi ${contributor.fullName || ''},`,
    '',
    `${assigner?.fullName || 'A manager'} assigned a new task to you`,
    project?.name ? `in project "${project.name}".` : '.',
    '',
    `Task: ${task.description}`,
    task.hours ? `Estimated effort: ${task.hours} hrs` : null,
    task.dueDate ? `Due: ${task.dueDate}` : null,
    '',
    'Log in to the Buildicy ERP to start work.',
  ]
    .filter(Boolean)
    .join('\n');
  const html = `
    <p>Hi <strong>${contributor.fullName || ''}</strong>,</p>
    <p><strong>${assigner?.fullName || 'A manager'}</strong> assigned a new task to you${
      project?.name ? ` in project <strong>${project.name}</strong>` : ''
    }.</p>
    <p><strong>Task:</strong> ${task.description}</p>
    ${task.hours ? `<p><strong>Estimated effort:</strong> ${task.hours} hrs</p>` : ''}
    ${task.dueDate ? `<p><strong>Due:</strong> ${task.dueDate}</p>` : ''}
    <p>Log in to the Buildicy ERP to start work.</p>
  `;
  return sendEmail({
    to: [contributor.email],
    subject,
    text,
    html,
    metadata: { event: 'TASK_ASSIGNED', taskId: task.id },
  });
}

module.exports = { taskAssigned };
