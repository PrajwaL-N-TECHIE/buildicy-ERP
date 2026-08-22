/**
 * Singleton Resend SDK client. Reads RESEND_API_KEY from process.env
 * (set via `firebase functions:secrets:set RESEND_API_KEY`).
 *
 * In local dev, set RESEND_API_KEY in functions/.runtimeconfig.json:
 *   { "resend": { "api_key": "re_..." } }
 *
 * The sendEmail() helper wraps resend.emails.send with logging + retries.
 */
const { Resend } = require('resend');

const API_KEY =
  process.env.RESEND_API_KEY ||
  (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG || '{}').resend?.api_key);

let client = null;

function getClient() {
  if (!API_KEY) {
    console.warn(
      '[mail] RESEND_API_KEY is not set. Email sends will fail. ' +
        'Run `firebase functions:secrets:set RESEND_API_KEY` before deploying.'
    );
    return null;
  }
  if (!client) client = new Resend(API_KEY);
  return client;
}

const FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || 'erp@buildicy.com';

/**
 * Send a transactional email via Resend. Never throws — failures are
 * logged so the calling trigger doesn't fail its retry loop on bad emails.
 */
async function sendEmail({ to, subject, text, html, metadata = {} }) {
  const resend = getClient();
  if (!resend) {
    console.warn(`[mail] Skipping send (no API key): ${subject}`);
    return { skipped: true };
  }
  if (!Array.isArray(to) || to.length === 0) {
    console.warn(`[mail] Skipping send (no recipients): ${subject}`);
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      text,
      html,
      tags: Object.entries(metadata).map(([name, value]) => ({ name, value: String(value) })),
    });
    if (result.error) {
      console.error(`[mail] Resend returned error: ${result.error.message}`, { subject, to });
      return { error: result.error };
    }
    console.log(`[mail] Sent: ${subject} (id=${result.data?.id})`, { to, subject, ...metadata });
    return { id: result.data?.id };
  } catch (err) {
    console.error(`[mail] Send threw: ${err.message}`, { subject, to, ...metadata });
    return { error: err };
  }
}

module.exports = {
  sendEmail,
  getClient,
  FROM_ADDRESS,
};
