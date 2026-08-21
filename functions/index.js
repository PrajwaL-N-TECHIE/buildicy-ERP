const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Cloud Function 1: On Task Written -> create mail trigger document if status changed or assigned
exports.onTaskWritten = functions.firestore
  .document('tasks/{taskId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    if (!after) return null; // deleted task

    const db = admin.firestore();

    // 1. Task newly assigned
    if (!before && after.assignedBy) {
      const assigneeDoc = await db.collection('users').doc(after.contributorId).get();
      const assignerDoc = await db.collection('users').doc(after.assignedBy).get();
      if (assigneeDoc.exists) {
        await db.collection('mail').add({
          to: [assigneeDoc.data().email],
          message: {
            subject: `[Task Assigned] New assignment: ${after.description.substring(0, 40)}`,
            text: `You have been assigned a new task by ${assignerDoc.exists ? assignerDoc.data().fullName : 'Manager'}.\n\nTask: ${after.description}\nDue: ${after.dueDate || 'N/A'}`
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // 2. Status change transitions
    if (before && before.status !== after.status) {
      // Reviewer/Admin sent back -> In Progress
      if (after.status === 'In Progress' && (after.reviewerDecision === 'sent_back' || after.adminDecision === 'sent_back')) {
        const contributorDoc = await db.collection('users').doc(after.contributorId).get();
        if (contributorDoc.exists) {
          const remark = after.adminRemark || after.reviewerRemark || 'No remark provided';
          await db.collection('mail').add({
            to: [contributorDoc.data().email],
            message: {
              subject: `[Action Required] Task Sent Back for Revisions`,
              text: `Your task was sent back for revisions.\n\nTask: ${after.description}\nRemark: ${remark}`
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      // Reviewer Approved -> Pending Admin
      if (after.status === 'Pending Admin') {
        const adminsSnap = await db.collection('users').where('roleTier', '==', 'admin').get();
        const adminEmails = adminsSnap.docs.map(doc => doc.data().email);
        if (adminEmails.length > 0) {
          await db.collection('mail').add({
            to: adminEmails,
            message: {
              subject: `[Approval Queue] Task Submitted for Admin Approval`,
              text: `A task has been approved by reviewer and is pending admin sign-off.\n\nTask: ${after.description}`
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      // Admin Final Approved -> Completed
      if (after.status === 'Completed') {
        const contributorDoc = await db.collection('users').doc(after.contributorId).get();
        if (contributorDoc.exists) {
          await db.collection('mail').add({
            to: [contributorDoc.data().email],
            message: {
              subject: `[Completed] Task Approved!`,
              text: `Your task received final admin approval.\n\nTask: ${after.description}`
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }

    return null;
  });

// Cloud Function 2: On Project Deadline Updated
exports.onProjectWritten = functions.firestore
  .document('projects/{projectId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after || !after.deadline) return null;

    const beforeDeadline = before ? JSON.stringify(before.deadline) : null;
    const afterDeadline = JSON.stringify(after.deadline);

    if (beforeDeadline !== afterDeadline) {
      const db = admin.firestore();
      const memberDocs = await Promise.all(
        (after.memberIds || []).map(id => db.collection('users').doc(id).get())
      );
      const memberEmails = memberDocs.filter(d => d.exists).map(d => d.data().email);
      if (memberEmails.length > 0) {
        await db.collection('mail').add({
          to: memberEmails,
          message: {
            subject: `[Project Deadline] Updated deadline for ${after.name}`,
            text: `The deadline for ${after.name} has been updated to ${after.deadline.dueDate}.\nNote: ${after.deadline.note || 'N/A'}`
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    return null;
  });

// Cloud Function 3: On Meeting Scheduled
exports.onMeetingCreated = functions.firestore
  .document('meetings/{meetingId}')
  .onCreate(async (snap, context) => {
    const meeting = snap.data();
    if (!meeting || !meeting.participantIds || meeting.participantIds.length === 0) return null;

    const db = admin.firestore();
    const participantDocs = await Promise.all(
      meeting.participantIds.map(id => db.collection('users').doc(id).get())
    );
    const emails = participantDocs.filter(d => d.exists).map(d => d.data().email);

    if (emails.length > 0) {
      await db.collection('mail').add({
        to: emails,
        message: {
          subject: `[Meeting Invitation] ${meeting.title}`,
          text: `You are invited to: ${meeting.title}\nWhen: ${meeting.scheduledAt}\nLocation: ${meeting.location}\nNotes: ${meeting.notes || 'N/A'}`
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    return null;
  });
