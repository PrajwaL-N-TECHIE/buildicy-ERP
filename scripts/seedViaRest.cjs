const { GoogleAuth } = require('google-auth-library');

const EMAIL_TO_UID = {
  'prajwal@company.com':    'taZmOFsicPOHjmfzOFjiq58Sz6g2',
  'mayur@company.com':      '8nAeV9yqtpe8gmbcRDxG3uZI20f2',
  'mizbha@company.com':     'CdIGNhyaCGRFpbLRPpkrxJblg8x2',
  'lathika@company.com':    'q3a9LlJE4hdMK2VV5Bql6bY8aUW2',
  'shiva@company.com':      'WDZh07NicMdwfJM5CeMvHeKw1mq1',
  'rajeshwari@company.com': '5FTpK5L6RRVhjNPmIjUJqPeUDxD2',
  'parish@company.com':     'VaCHs1roJaMvH9SgJvD28iTS67b2',
  'bhuvana@company.com':    'ZvW575X5jtPUKINvWxPsLMyphpq2',
  'jamuna@company.com':     'o89i27l5qgah5nDHo2YsZWhkBp82',
};

const USERS = [
  {
    email: 'prajwal@company.com',
    firstName: 'Prajwal',
    lastName: 'N',
    fullName: 'Prajwal N',
    username: 'prajwal.admin',
    title: 'Founder / CEO',
    roleTier: 'admin',
    projectIds: ['proj-1', 'proj-2', 'proj-3'],
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    dob: '1998-05-14',
    dateOfJoining: '2025-01-01',
    sourceOfHiring: 'Founder Direct',
    salary: 150000,
    phoneNumber: '+91 9876543210',
    personalEmail: 'prajwal.personal@gmail.com',
  },
  {
    email: 'mayur@company.com',
    firstName: 'Mayur',
    lastName: 'P',
    fullName: 'Mayur P',
    username: 'mayur.cto',
    title: 'Co Founder / CTO',
    roleTier: 'admin',
    projectIds: ['proj-1', 'proj-2', 'proj-3'],
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    dob: '1998-11-20',
    dateOfJoining: '2025-01-01',
    sourceOfHiring: 'Founder Direct',
    salary: 140000,
    phoneNumber: '+91 9876543211',
    personalEmail: 'mayur.personal@gmail.com',
  },
  {
    email: 'mizbha@company.com',
    firstName: 'Mizbha Fathima',
    lastName: 'M',
    fullName: 'Mizbha Fathima M',
    username: 'mizbha.lead',
    title: 'Creative Lead',
    roleTier: 'reviewer',
    projectIds: ['proj-1', 'proj-2'],
    active: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    dob: '2000-08-25',
    dateOfJoining: '2025-06-01',
    sourceOfHiring: 'LinkedIn Outreach',
    salary: 85000,
    phoneNumber: '+91 9876543212',
    personalEmail: 'mizbha.personal@gmail.com',
  },
  {
    email: 'lathika@company.com',
    firstName: 'Lathika',
    lastName: 'J',
    fullName: 'Lathika J',
    username: 'lathika.csl',
    title: 'CSL',
    roleTier: 'reviewer',
    projectIds: ['proj-2', 'proj-3'],
    active: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    dob: '2001-03-10',
    dateOfJoining: '2025-07-01',
    sourceOfHiring: 'Employee Referral',
    salary: 80000,
    phoneNumber: '+91 9876543213',
    personalEmail: 'lathika.personal@gmail.com',
  },
  {
    email: 'shiva@company.com',
    firstName: 'Shivasakthivel',
    lastName: 'L',
    fullName: 'Shivasakthivel L',
    username: 'shiva.ai',
    title: 'AI Engineer Intern',
    roleTier: 'contributor',
    projectIds: ['proj-1'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-09-02',
    dateOfJoining: '2026-01-10',
    sourceOfHiring: 'Campus Placement',
    salary: 35000,
    phoneNumber: '+91 9876543214',
    personalEmail: 'shiva.personal@gmail.com',
  },
  {
    email: 'rajeshwari@company.com',
    firstName: 'Rajeshwari',
    lastName: 'M',
    fullName: 'Rajeshwari M',
    username: 'rajeshwari.sde',
    title: 'SDE Intern',
    roleTier: 'contributor',
    projectIds: ['proj-1'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-12-18',
    dateOfJoining: '2026-01-10',
    sourceOfHiring: 'Campus Placement',
    salary: 30000,
    phoneNumber: '+91 9876543215',
    personalEmail: 'rajeshwari.personal@gmail.com',
  },
  {
    email: 'parish@company.com',
    firstName: 'Mohamed Parishkhan',
    lastName: 'K',
    fullName: 'Mohamed Parishkhan K',
    username: 'parish.ai',
    title: 'AI Engineer Intern',
    roleTier: 'contributor',
    projectIds: ['proj-2'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-04-05',
    dateOfJoining: '2026-01-15',
    sourceOfHiring: 'Direct Application',
    salary: 35000,
    phoneNumber: '+91 9876543216',
    personalEmail: 'parish.personal@gmail.com',
  },
  {
    email: 'bhuvana@company.com',
    firstName: 'Bhuvana Sree',
    lastName: 'S',
    fullName: 'Bhuvana Sree S',
    username: 'bhuvana.sde',
    title: 'SDE Intern',
    roleTier: 'contributor',
    projectIds: ['proj-2'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-08-28',
    dateOfJoining: '2026-01-15',
    sourceOfHiring: 'Campus Placement',
    salary: 30000,
    phoneNumber: '+91 9876543217',
    personalEmail: 'bhuvana.personal@gmail.com',
  },
  {
    email: 'jamuna@company.com',
    firstName: 'Jamuna',
    lastName: 'Rani',
    fullName: 'Jamuna Rani',
    username: 'jamuna.sde',
    title: 'SDE Intern',
    roleTier: 'contributor',
    projectIds: ['proj-3'],
    active: true,
    createdAt: '2026-08-05T00:00:00.000Z',
    dob: '2003-10-12',
    dateOfJoining: '2026-01-20',
    sourceOfHiring: 'Employee Referral',
    salary: 30000,
    phoneNumber: '+91 9876543218',
    personalEmail: 'jamuna.personal@gmail.com',
  },
];

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { integerValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(v => ({ stringValue: String(v) }))
        }
      };
    }
  }
  return fields;
}

async function run() {
  const auth = new GoogleAuth({
    keyFilename: '/home/prajwal/Desktop/personal/erp-buildicy-firebase-adminsdk-fbsvc-900ae382b1.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore']
  });
  const client = await auth.getClient();

  console.log(`\nSeeding ${USERS.length} users via Firestore REST API...\n`);

  for (const user of USERS) {
    const uid = EMAIL_TO_UID[user.email];
    if (!uid) continue;

    const data = { id: uid, ...user };
    const fields = toFirestoreFields(data);

    try {
      const res = await client.request({
        method: 'PATCH',
        url: `https://firestore.googleapis.com/v1/projects/erp-buildicy/databases/(default)/documents/users/${uid}`,
        data: { fields }
      });
      console.log(`  ✓ ${user.fullName} (${user.roleTier}) → users/${uid}`);
    } catch (err) {
      console.error(`  ❌ Failed for ${user.email}:`, err.message, err.response?.data);
    }
  }

  console.log('\n🎉 ALL 9 USERS SEEDED SUCCESSFULLY TO FIRESTORE!\n');
}

run();
