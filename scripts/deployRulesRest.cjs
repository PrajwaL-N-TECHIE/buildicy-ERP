const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');

async function deploy() {
  const auth = new GoogleAuth({
    keyFilename: '/home/prajwal/Desktop/personal/erp-buildicy-firebase-adminsdk-fbsvc-900ae382b1.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const rulesContent = fs.readFileSync('/home/prajwal/Desktop/personal/firestore.rules', 'utf8');

  console.log('Uploading firestore.rules to Firebase Rules API...');
  const resSet = await client.request({
    method: 'POST',
    url: 'https://firebaserules.googleapis.com/v1/projects/erp-buildicy/rulesets',
    data: {
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent
          }
        ]
      }
    }
  });

  const rulesetName = resSet.data.name;
  console.log('✅ Ruleset Created:', rulesetName);

  try {
    const resRelease = await client.request({
      method: 'PUT',
      url: 'https://firebaserules.googleapis.com/v1/projects/erp-buildicy/releases/cloud.firestore',
      data: {
        name: 'projects/erp-buildicy/releases/cloud.firestore',
        rulesetName: rulesetName
      }
    });
    console.log('🎉 RULES SUCCESSFULLY RELEASED TO CLOUD FIRESTORE via PUT!', resRelease.data.name);
  } catch (err) {
    console.log('PUT failed, trying POST create release...');
    const resCreate = await client.request({
      method: 'POST',
      url: 'https://firebaserules.googleapis.com/v1/projects/erp-buildicy/releases',
      data: {
        name: 'projects/erp-buildicy/releases/cloud.firestore',
        rulesetName: rulesetName
      }
    });
    console.log('🎉 RULES SUCCESSFULLY CREATED & RELEASED TO CLOUD FIRESTORE via POST!', resCreate.data.name);
  }
}

deploy().catch(e => console.error('❌ RULES DEPLOY ERROR:', e.message, e.response?.data));
