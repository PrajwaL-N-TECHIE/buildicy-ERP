/**
 * Buildicy ERP — Cloud Functions entrypoint.
 *
 * Phase 4: Resend email integration (background triggers).
 * Phase 5: Server-side writes via callable Cloud Functions.
 *
 * Firestore triggers dispatch Resend templates. Callable functions
 * enforce state-machine + RBAC and write via admin SDK. SPA flips
 * VITE_USE_CF_WRITES=true to route mutations through callables.
 */
const admin = require('firebase-admin');
admin.initializeApp();

// Resend triggers (Phase 4)
const { onTaskWritten } = require('./src/triggers/onTaskWritten');
const { onProjectWritten } = require('./src/triggers/onProjectWritten');
const { onMeetingCreated } = require('./src/triggers/onMeetingCreated');
exports.onTaskWritten = onTaskWritten;
exports.onProjectWritten = onProjectWritten;
exports.onMeetingCreated = onMeetingCreated;

// Callable functions (Phase 5)
exports.createTask = require('./src/tasks/createTask').createTask;
exports.updateTaskStatus = require('./src/tasks/updateTaskStatus').updateTaskStatus;
exports.reviewTaskByReviewer = require('./src/tasks/reviewTaskByReviewer').reviewTaskByReviewer;
exports.reviewTaskByAdmin = require('./src/tasks/reviewTaskByAdmin').reviewTaskByAdmin;
exports.updateProjectDeadline = require('./src/projects/updateDeadline').updateProjectDeadline;
exports.scheduleMeeting = require('./src/meetings/scheduleMeeting').scheduleMeeting;
exports.deleteMeeting = require('./src/meetings/deleteMeeting').deleteMeeting;
exports.checkIn = require('./src/attendance/checkIn').checkIn;
exports.checkOut = require('./src/attendance/checkOut').checkOut;

// Audit log triggers (Phase 8)
exports.audit_task = require('./src/audit/onAnyWrite').audit_task;
exports.audit_project = require('./src/audit/onAnyWrite').audit_project;
exports.audit_meeting = require('./src/audit/onAnyWrite').audit_meeting;

// Scheduled digest (Phase 9)
exports.scheduledDigest = require('./src/triggers/scheduledDigest').scheduledDigest;
