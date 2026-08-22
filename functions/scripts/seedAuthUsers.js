/**
 * Phase 1 — seed Firebase Auth users + custom claims + profile docs.
 *
 * Creates 9 Auth users (one per SEED_USER entry) and:
 *   1. Sets the custom claim { roleTier } so firestore.rules can enforce
 *      RBAC server-side.
 *   2. Writes (merges) the profile document at users/{uid}.
 *   3. Applies a role-tier default password that the user must change on
 *      first login (Phase 9 will enforce rotation).
 *
 * The mapping between the legacy user-{n} IDs and the Firebase Auth UID
 * is preserved by using the seed ID as the Auth UID. This means:
 *   - Existing references like contributorId: 'user-5' still work.
 *   - The new login flow goes through Firebase Auth with the user's email.
 *   - cross_device session continuity works because the UID matches.
 *
 * Re-runnable: existing users are updated, not duplicated.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json \
 *   node functions/scripts/seedAuthUsers.js
 *
 * Set DEFAULT_PASSWORD env var to override the per-role defaults below.
 */

const path = require('path');
const admin = require('firebase-admin');

const { SEED_USERS } = require(
  path.resolve(__dirname, '..', 'src', 'seed', 'seedUsers.js')
);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
  console.error('Generate a service account JSON from Firebase Console →');
  console.error('Project Settings → Service Accounts → Generate new private key,');
  console.error('save as functions/service-account.json, then run with:');
  console.error(
    '  GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json node functions/scripts/seedAuthUsers.js'
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const DEFAULT_PASSWORDS = {
  admin: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@1234',
  reviewer: process.env.DEFAULT_REVIEWER_PASSWORD || 'Review@1234',
  contributor: process.env.DEFAULT_CONTRIBUTOR_PASSWORD || 'Intern@1234',
};

function defaultPasswordFor(roleTier) {
  return DEFAULT_PASSWORDS[roleTier] || DEFAULT_PASSWORDS.contributor;
}

async function ensureAuthUser(user) {
  const email = user.email;
  let fbUser;
  try {
    fbUser = await admin.auth().getUserByEmail(email);
    console.log(`  ↻ Auth user exists: ${email} (uid=${fbUser.uid})`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    fbUser = await admin.auth().createUser({
      uid: user.id,
      email,
      password: defaultPasswordFor(user.roleTier),
      displayName: user.fullName,
      emailVerified: true,
    });
    console.log(`  ✓ Created Auth user: ${email} (uid=${fbUser.uid})`);
  }
  return fbUser;
}

async function setCustomClaims(fbUser, roleTier) {
  const current = (await admin.auth().getUser(fbUser.uid)).customClaims || {};
  if (current.roleTier === roleTier) return false;
  await admin.auth().setCustomUserClaims(fbUser.uid, { roleTier });
  return true;
}

async function writeProfileDoc(user) {
  const ref = admin.firestore().doc(`users/${user.id}`);
  const { id, ...rest } = user;
  await ref.set(
    {
      ...rest,
      id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function migrateLegacyIds() {
  // No-op for now — Phase 8 will move foreign keys from user-{n} style
  // to Auth UID style once all consumers are migrated.
}

(async () => {
  try {
    console.log(`Seeding ${SEED_USERS.length} Firebase Auth users...\n`);
    for (const user of SEED_USERS) {
      const fbUser = await ensureAuthUser(user);
      const claimsChanged = await setCustomClaims(fbUser, user.roleTier);
      await writeProfileDoc(user);
      console.log(
        `  ${claimsChanged ? '✓' : ' '} ${user.fullName.padEnd(22)} ` +
          `(${user.roleTier.padEnd(11)}) uid=${fbUser.uid}`
      );
    }
    await migrateLegacyIds();
    console.log('\nAuth seed complete.');
    console.log('\nDefault passwords (change on first login):');
    console.log(`  admin       → ${DEFAULT_PASSWORDS.admin}`);
    console.log(`  reviewer    → ${DEFAULT_PASSWORDS.reviewer}`);
    console.log(`  contributor → ${DEFAULT_PASSWORDS.contributor}`);
    process.exit(0);
  } catch (err) {
    console.error('Auth seed failed:', err);
    process.exit(1);
  }
})();
