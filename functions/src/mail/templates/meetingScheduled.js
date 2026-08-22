const { sendEmail } = require('../resendClient');

/**
 * Notify all meeting participants that a meeting has been scheduled.
 */
async function meetingScheduled(meeting, participants = [], organizer, project) {
  const emails = participants.map((p) => p.email).filter(Boolean);
  if (emails.length === 0) return;
  const when = meeting.scheduledAt
    ? new Date(meeting.scheduledAt).toLocaleString()
    : 'TBD';
  const subject = `[Meeting] ${meeting.title}`;
  const text = [
    `Hi,`,
    '',
    `${organizer?.fullName || 'A colleague'} invited you to a meeting.`,
    '',
    `Title: ${meeting.title}`,
    `When: ${when}`,
    meeting.location ? `Location: ${meeting.location}` : null,
    project?.name ? `Project: ${project.name}` : null,
    meeting.notes ? `\nNotes: ${meeting.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const html = `
    <p>Hi,</p>
    <p><strong>${organizer?.fullName || 'A colleague'}</strong> invited you to a meeting.</p>
    <p><strong>Title:</strong> ${meeting.title}</p>
    <p><strong>When:</strong> ${when}</p>
    ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
    ${project?.name ? `<p><strong>Project:</strong> ${project.name}</p>` : ''}
    ${meeting.notes ? `<p><strong>Notes:</strong> ${meeting.notes}</p>` : ''}
  `;
  return sendEmail({
    to: emails,
    subject,
    text,
    html,
    metadata: { event: 'MEETING_SCHEDULED', meetingId: meeting.id },
  });
}

module.exports = { meetingScheduled };
