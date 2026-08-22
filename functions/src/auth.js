/**
 * Auth helpers for Cloud Functions. Wraps Firebase Auth verification
 * with role-tier checks pulled from custom claims.
 */

const { HttpsError } = require('firebase-functions/v2/https');

const ROLES = ['admin', 'reviewer', 'contributor'];

function getRole(actor) {
  // actor.token is populated by the functions runtime; it carries the
  // custom claims we set in functions/scripts/seedAuthUsers.js.
  return actor?.token?.roleTier || null;
}

function requireAuth(actor) {
  if (!actor) {
    throw new HttpsError('unauthenticated', 'Sign in is required.');
  }
}

function requireRole(actor, allowed) {
  requireAuth(actor);
  const role = getRole(actor);
  if (!role) {
    throw new HttpsError('permission-denied', 'No role claim on user token.');
  }
  if (!ROLES.includes(role)) {
    throw new HttpsError('permission-denied', `Unknown role: ${role}`);
  }
  if (Array.isArray(allowed) && !allowed.includes(role)) {
    throw new HttpsError(
      'permission-denied',
      `Action requires one of: ${allowed.join(', ')}. You are: ${role}.`
    );
  }
  return { uid: actor.uid, role, name: actor.token.name || actor.token.email };
}

module.exports = { requireAuth, requireRole, getRole, ROLES };
