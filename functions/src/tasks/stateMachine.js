/**
 * Phase 5: Task status state machine.
 *
 * Encodes the legal transitions per role. Server-side enforcement is
 * authoritative — even if the SPA somehow lets the user attempt an
 * illegal transition, this returns false and the call is rejected.
 */

const TRANSITIONS = {
  contributor: {
    'Not Started': ['In Progress'],
    'In Progress': ['Submitted'],
  },
  reviewer: {
    Submitted: ['In Progress', 'Pending Admin'],
  },
  admin: {
    'Pending Admin': ['In Progress', 'Completed'],
  },
};

function canTransition(from, to, role) {
  const allowed = TRANSITIONS[role]?.[from] ?? [];
  return allowed.includes(to);
}

const ALL_STATUSES = ['Not Started', 'In Progress', 'Submitted', 'Pending Admin', 'Completed'];

module.exports = { canTransition, ALL_STATUSES, TRANSITIONS };
