/**
 * Idempotent Firestore seed using firebase-admin.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json \
 *   node scripts/seedFirestore.js
 *
 * Writes the canonical SEED_USERS list from functions/src/seed/seedUsers.js
 * to Firestore under users/{uid}. Each doc is merged, so existing data
 * is not overwritten.
 */
const path = require('path');
const admin = require('firebase-admin');

// Lazy-load seed data from the functions package so this file never
// duplicates the source-of-truth list.
const { SEED_USERS } = require(path.resolve(__dirname, '..', 'functions', 'src', 'seed', 'seedUsers.js'));

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set. Aborting.');
  console.error('Generate a service account JSON from Firebase Console →');
  console.error('Project Settings → Service Accounts → Generate new private key,');
  console.error('save as functions/service-account.json, then run with:');
  console.error('  GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json node scripts/seedFirestore.js');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function seedUsers() {
  console.log(`Seeding ${SEED_USERS.length} users to Firestore...`);
  for (const user of SEED_USERS) {
    const ref = db.doc(`users/${user.id}`);
    await ref.set(
      {
        ...user,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`  ✓ ${user.fullName} (${user.title}) → users/${user.id}`);
  }
}

(async () => {
  try {
    await seedUsers();
    console.log('Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();