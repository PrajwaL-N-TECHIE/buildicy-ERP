import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import fs from 'fs';

function resendMailPlugin() {
  const emailsFilePath = path.resolve(__dirname, 'server_sent_emails.json');

  const getSavedEmails = (): any[] => {
    if (!fs.existsSync(emailsFilePath)) return [];
    try {
      const content = fs.readFileSync(emailsFilePath, 'utf-8');
      return JSON.parse(content || '[]');
    } catch {
      return [];
    }
  };

  const saveEmailRecord = (record: any) => {
    try {
      const existing = getSavedEmails();
      const updated = [record, ...existing.filter((item: any) => item.id !== record.id)];
      fs.writeFileSync(emailsFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Resend Proxy Plugin] Failed to save email log to file:', err);
    }
  };

  return {
    name: 'resend-mail-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/get-emails', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(getSavedEmails()));
      });

      server.middlewares.use('/api/clear-emails', (req: any, res: any) => {
        try {
          fs.writeFileSync(emailsFilePath, JSON.stringify([], null, 2), 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, message: 'Logs cleared successfully' }));
        } catch (err: any) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err?.message }));
        }
      });

      server.middlewares.use('/api/send-email', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const apiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY || '';

            let resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: payload.from && payload.from.includes('resend.dev') ? payload.from : 'onboarding@resend.dev',
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
              }),
            });

            let data = await resendResponse.json();

            // If initial request failed, try fallback with onboarding@resend.dev
            if (!resendResponse.ok && payload.from && !payload.from.includes('resend.dev')) {
              console.warn('[Resend Proxy] Retrying with onboarding@resend.dev fallback due to domain restriction');
              resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'onboarding@resend.dev',
                  to: payload.to,
                  subject: payload.subject,
                  html: payload.html,
                  text: payload.text,
                }),
              });
              data = await resendResponse.json();
            }

            const toList = Array.isArray(payload.to) ? payload.to : [payload.to];

            const resolveEvent = (p: any): string => {
              if (p.triggerEvent && p.triggerEvent !== 'TASK_ASSIGNED') return p.triggerEvent;
              const subj = (p.subject || '').toLowerCase();
              const body = (p.html || p.text || '').toLowerCase();
              if (subj.includes('welcome') || subj.includes('invite') || body.includes('welcome to buildicy') || body.includes('team onboarding')) return 'WELCOME_INVITE';
              if (subj.includes('password') || subj.includes('recovery')) return 'FORGOT_PASSWORD';
              if (subj.includes('birthday') || subj.includes('🎂') || body.includes('happy birthday')) return 'BIRTHDAY_WISH';
              if (subj.includes('meeting') || subj.includes('scheduled')) return 'MEETING_SCHEDULED';
              if (subj.includes('cancelled') || subj.includes('deleted')) return 'TASK_DELETED';
              if (subj.includes('overdue') || subj.includes('digest')) return 'DAILY_OVERDUE_DIGEST';
              if (subj.includes('project') || subj.includes('deadline')) return 'PROJECT_UPDATE';
              if (subj.includes('attendance') || subj.includes('shift')) return 'ATTENDANCE_ALERT';
              if (subj.includes('announcement') || subj.includes('hr')) return 'HR_ANNOUNCEMENT';
              return p.triggerEvent || 'TASK_ASSIGNED';
            };

            const logRecord = {
              id: data.id ? `mail-${data.id}` : `mail-${Date.now()}`,
              to: toList,
              subject: payload.subject || '[Buildicy ERP] Outbound Notification',
              bodyText: payload.text || (payload.html ? payload.html.replace(/<[^>]*>?/gm, '') : 'Live Email Dispatch'),
              htmlText: payload.html || undefined,
              triggerEvent: resolveEvent(payload),
              createdAt: new Date().toISOString(),
            };
            saveEmailRecord(logRecord);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ...data, success: true, id: logRecord.id }));
          } catch (err: any) {
            console.error('[Resend Proxy Plugin Error]', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ message: err?.message || 'Server mail dispatch exception' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), resendMailPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
  },
});
