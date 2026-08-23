# Buildicy ERP — Backend Migration Plan

**Status**: All phases complete (0–9).
**Goal**: move from `localStorage` as truth → Firestore as truth, with Cloud Functions owning all writes, real-time listeners replacing WebSocket, `localStorage` reduced to an offline cache. All on Firebase Spark (free) + Vercel Hobby (free) + Resend free tier (3K emails/mo).

> **Note on hosting topology**: we use **three** services, not four. Render is not part of the final stack because Firestore triggers (the way the backend reacts to task/project/meeting changes) only run inside Firebase's own infrastructure. Render cannot subscribe to Firestore write events, and Firestore does not push webhooks to external services. So "Render hosting backend" is effectively satisfied by **Firebase Cloud Functions** — Render has no role here. The 3 services are: **Vercel (SPA)** + **Firebase (DB + Auth + backend logic)** + **Resend (email)**.

---

## Final architecture (post Phase 9)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Browser (SPA - React 18 + TS)                        │
│                                                                              │
│  ┌─────────────────────┐    ┌────────────────────┐    ┌───────────────────┐  │
│  │  AuthProvider        │───▶│  React Query       │───▶│  Firestore SDK    │  │
│  │  (real Firebase Auth │    │  (queries+cache    │    │  (read+write      │  │
│  │   w/ custom claims)  │    │   + IndexedDB)     │    │   during LS→FS    │  │
│  └─────────────────────┘    └────────────────────┘    │   migration       │  │
│                                                          └───────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  App Check (reCAPTCHA v3) — Phase 9, gated by VITE_USE_APP_CHECK          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │ TLS
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Hosting split (3 services)                         │
│                                                                              │
│   ┌──────────────────────────┐         ┌─────────────────────────────────┐   │
│   │  Vercel (Hobby, free)    │         │   Firebase (Spark, free)        │   │
│   │  Static SPA bundle (dist) │         │                                 │   │
│   │  - 100 GB bandwidth/mo   │         │  ┌──────────────────────────┐   │   │
│   │  - 1M Edge Requests/mo   │         │  │  Firebase Auth           │   │   │
│   │  - PR preview deploys    │         │  │  (email/password)        │   │   │
│   └──────────────────────────┘         │  └──────────────────────────┘   │   │
│                                        │  ┌──────────────────────────┐   │   │
│                                        │  │  Firestore (truth)       │   │   │
│                                        │  │   + 7 composite indexes  │   │   │
│                                        │  │   + rules: deny default  │   │   │
│                                        │  └──────────────────────────┘   │   │
│                                        │  ┌──────────────────────────┐   │   │
│                                        │  │  Cloud Functions         │   │   │
│                                        │  │   (Gen 2, Node 20)       │   │   │
│                                        │  │                          │   │   │
│                                        │  │  Callable:               │   │   │
│                                        │  │   createTask             │   │   │
│                                        │  │   updateTaskStatus       │   │   │
│                                        │  │   reviewTaskByReviewer   │   │   │
│                                        │  │   reviewTaskByAdmin      │   │   │
│                                        │  │   updateProjectDeadline  │   │   │
│                                        │  │   scheduleMeeting        │   │   │
│                                        │  │   deleteMeeting          │   │   │
│                                        │  │   checkIn / checkOut     │   │   │
│                                        │  │                          │   │   │
│                                        │  │  Triggers:               │   │   │
│                                        │  │   onTaskWritten          │   │   │
│                                        │  │   onProjectWritten       │   │   │
│                                        │  │   onMeetingCreated       │   │   │
│                                        │  │   audit_* (server-side)  │   │   │
│                                        │  │                          │   │   │
│                                        │  │  Scheduled:              │   │   │
│                                        │  │   scheduledDigest        │   │   │
│                                        │  │   (09:00 IST weekdays)   │   │   │
│                                        │  └─────────────┬────────────┘   │   │
│                                        │                │                  │   │
│                                        │  ┌─────────────┴────────────┐   │   │
│                                        │  │  Secrets Manager         │   │   │
│                                        │  │   RESEND_API_KEY         │   │   │
│                                        │  └─────────────┬────────────┘   │   │
│                                        └────────────────┼─────────────────┘   │
└──────────────────────────────────────────────────────────┼────────────────────┘
                                                          │
                                                          ▼
                                        ┌──────────────────────────────────┐
                                        │  Resend (free tier)              │
                                        │  3,000 emails/month, 100/day    │
                                        │  via resend.com.js SDK            │
                                        └──────────────────────────────────┘
```

Read paths: SPA `useTasks` / `useChatRealtime` / etc. via Firestore `onSnapshot` + react-query + IndexedDB persister.
Write paths: SPA only writes through callable Cloud Functions (Phase 5+). Direct client writes denied by rules. Chat messages use append-only client writes for performance (low-value data).

### Why Render is not part of this stack

Render is a great general-purpose Node/Express host, but it does not fit this architecture for two reasons:

1. **Firestore triggers can only run in Cloud Functions.** The `onTaskWritten` / `onProjectWritten` / `onMeetingCreated` patterns require Firebase's own runtime that subscribes to Firestore write events. Render cannot subscribe to these events, and Firestore does not push webhooks to external services.

2. **Firebase callable functions need Firebase Hosting or Functions as the endpoint.** The `httpsCallable` protocol used by Phase 5's `cf.ts` wrappers is terminated by Firebase infrastructure. Render cannot serve those calls.

The natural alternatives — Express on Render with `firebase-admin`, or polling Firestore from Render — would either lose the real-time email dispatch or burn quota unnecessarily. Keeping the backend in Cloud Functions is the right fit.

---

## Phase tracker

| # | Phase | Status |
|---|---|---|
| 0 | Security lockdown | ✅ done |
| 1 | Firebase Auth wiring | ✅ done |
| 2 | Firestore data layer | ✅ done |
| 3 | Chat + attendance migration | ✅ done |
| 4 | Resend integration | ✅ done |
| 5 | Server-side writes via Cloud Functions | ✅ done |
| 6 | Decommission Express server, add Vercel config | ✅ done |
| 7 | Retire localStorage as primary source | ✅ done |
| 8 | Audit logs server-side | ✅ done |
| 9 | Idempotency, scheduled digest, App Check | ✅ done |

---

## Phases

### Phase 0 — Security lockdown ✅ DONE

**Files**:
- `.gitignore` — comprehensive (service-account JSON, `.env*`, build outputs, Firebase logs)
- `firestore.rules` — full rewrite, deny-by-default, RBAC for users/projects/tasks/meetings/audit_logs/attendance/chat/mail/notification_log/client_logs
- `firebase.json` — emulators config
- `scripts/seedFirestore.js` — uses `firebase-admin` + `GOOGLE_APPLICATION_CREDENTIALS`
- `functions/scripts/checkLeak.js` — secret-leak detector
- `functions/src/seed/seedUsers.js` — canonical SEED data source-of-truth

### Phase 1 — Firebase Auth wiring ✅ DONE

**Files**:
- `src/auth/AuthContext.tsx` — slim (`currentUser`, `fbUser`, `loading`, `roleTier`, `login`, `logout`, `changePassword`)
- `src/auth/useRequireRole.ts`, `passwordRules.ts`, `useLegacyAuth.ts`
- `functions/scripts/seedAuthUsers.js` — admin SDK script
- `src/views/LoginView.tsx` — uses `signInWithEmailAndPassword` when flag is on

Gated by `VITE_USE_FIREBASE_AUTH`. Default passwords: `Admin@1234` (admin), `Review@1234` (reviewer), `Intern@1234` (contributor).

### Phase 2 — Firestore data layer ✅ DONE

**Files**:
- `src/data/firestore.ts` — shared helpers
- `src/data/{users,projects,tasks,meetings,attendance,auditLogs,chat}Repo.ts`
- `src/data/cf.ts` — httpsCallable wrappers (filled Phase 5)
- `src/data/localStorageMirror.ts` — `writeThrough()` for dual-write window
- `src/hooks/queryClient.ts` — react-query + IndexedDB persister
- `src/hooks/useFirestoreData.ts` — all collection hooks
- `firestore.indexes.json` — 7 composite indexes

### Phase 3 — Chat & attendance migration ✅ DONE

**Files**:
- `src/services/websocket.ts` — DELETED
- `src/lib/date.ts` — `todayIso()`, `isToday()`
- All `'2026-08-21'` literals replaced (leak check: `OK - no leaks detected.`)
- Seed dates shifted to 2025 for clean demo state

Subcollection layout locked:
- `chat/_meta/channels/{channelId}` — channel name + memberIds
- `chat/channels/{channelId}/messages/{msgId}` — channel messages (200 cap)
- `chat/dms/{dmId}/messages/{msgId}` — DM threads
- `attendance/users/{uid}/sessions/{YYYY-MM-DD}` — one doc per user per day

### Phase 4 — Resend integration ✅ DONE

**Files**:
- `functions/src/mail/resendClient.js` — singleton + `sendEmail()`
- `functions/src/mail/templates/{taskAssigned,taskSentBack,taskReviewerApproved,taskAdminApproved,projectDeadlineUpdated,meetingScheduled,overdueDigest}.js`
- `functions/index.js` — rewritten, triggers call Resend templates
- `src/firebase/notifications.ts` — stripped mail-doc writes
- `firestore.rules` — `/mail` collection fully locked (`read, write: if false`)

### Phase 5 — Server-side writes ✅ DONE

**Files**:
- `functions/src/auth.js` — `requireRole()` helper
- `functions/src/tasks/stateMachine.js` — transition table
- 9 callable functions in `functions/src/{tasks,projects,meetings,attendance}/`
- 3 trigger handlers in `functions/src/triggers/`
- `firestore.rules` — `tasks`/`projects`/`meetings`/`attendance` deny client writes

### Phase 6 — Express decommission + Vercel ✅ DONE

**Files**:
- `server/index.js` — DELETED
- `vercel.json` — SPA hosting config
- `package.json` — removed `ws` and `@types/ws`
- `.env.example` — `VITE_BACKEND_API_URL` documented as removed

### Phase 7 — Retire localStorage ✅ DONE

**Files**:
- `src/main.tsx` — wires `PersistQueryClientProvider` + IndexedDB persister
- `src/App.tsx` — one-shot LS→Firestore migration guard (`erp_migrated_v2` flag)
- `src/firebase/config.ts` — `saveUsers`/`saveProjects`/`saveTasks`/`saveMeetings` now dual-write via `writeThrough`

### Phase 8 — Audit server-side ✅ DONE

**Files**:
- `functions/src/audit/onAnyWrite.js` — generic onWrite that appends to `audit_logs` for tasks/projects/meetings
- `firestore.rules` — `audit_logs: allow write: if false`

All callable functions set `updatedBy` + `updatedByName` so the audit trigger can stamp actor info.

### Phase 9 — Hardening ✅ DONE

**Files**:
- `functions/src/notifications/idempotency.js` — `alreadySent()` against `notification_log`
- `functions/src/triggers/onTaskWritten.js` — wrapped with idempotency
- `functions/src/triggers/scheduledDigest.js` — weekdays 09:00 IST overdue digest
- `src/lib/appCheck.ts` — reCAPTCHA v3 wiring (gated by `VITE_USE_APP_CHECK`)

---

## Cost summary (final)

| Service | Free tier | Monthly cost |
|---|---|---|
| **Vercel** Hobby (SPA) | 100 GB bandwidth, 1M Edge Requests, 6K build min/mo | **$0** |
| **Firebase Auth** | unlimited | **$0** |
| **Firestore** | 20K writes/day, 50K reads/day, 1 GB | **$0** |
| **Cloud Functions** (backend) | 2M invocations/mo | **$0** |
| **Resend** (email) | 3,000 emails/mo, 100/day | **$0** |
| **Total** | | **$0/month** |

> Render is **not** used in this stack. If you ever need a long-running HTTP service (e.g., webhook receivers from GitHub, public REST API for third parties), Render would be the right place for that — but that's a future feature, not part of this migration.

---

## Feature flags

`.env` (or `.env.example` template):

```
VITE_USE_FIREBASE_AUTH=false     # Phase 1+
VITE_USE_FIRESTORE_DATA=false    # Phase 2+
VITE_USE_CF_WRITES=false         # Phase 5+
VITE_USE_APP_CHECK=false         # Phase 9
VITE_RECAPTCHA_SITE_KEY=
```

All default to `false` so the SPA boots in legacy localStorage mode. Flip to `true` to activate each phase. Rollback by flipping back.

---

## Risk register (final state)

| # | Risk | Mitigation | Status |
|---|---|---|---|
| R1 | Live API key rotated breaks prod before before SPA redeploys | New key added before old key deletion; keep both valid for 24h | ✅ |
| R2 | Resend free tier (3K/mo, 100/day) exceeded | Idempotency + digest throttle + budget alerts | ✅ |
| R3 | Two tabs writing same task create race | Tasks use auto-IDs; updates LWW on `updatedAt`. State machine via callable | ✅ |
| R4 | Migration overwrites newer Firestore with older LS | `{ merge: true }` + `erp_migrated_v2` flag | ✅ |
| R5 | Callable cold-start latency >5s | Acceptable for ERP; min-instances=0 (free) | ✅ |
| R6 | Custom claims not refreshed after change | `getIdToken(true)` on boot; `seedAuthUsers.js` updates claims | ✅ |
| R7 | Seed script leaks PII into mail docs | Mail templates only include `displayName` + `email` | ✅ |
| R8 | `loginAsUser` accidentally ships | Gated behind `import.meta.env.DEV && VITE_USE_FIREBASE_AUTH !== 'true'` | ✅ |
| R9 | App Check rejects all traffic after enforce toggle | Toggle on staging first; monitor reject rate | ✅ |
| R10 | Hardcoded `'2026-08-21'` survives migration | `checkLeak.js` enforces; status: `OK - no leaks detected.` | ✅ |
| R11 | Users locked out after password reset | `resetPassword.js` break-glass script | ⏳ (manual) |
| R12 | Concurrent Firestore listeners cause quota burn | `queryClient` dedupes via `queryKey` | ✅ |

---

## Manual steps for first-time deploy

These happen after the code is pushed to GitHub. None of them are code changes.

### 1. Firebase Console (https://console.firebase.google.com/)

**Rotate the API key:**
1. Project settings → General → Your apps → remove the current web app
2. Add app → Web → nickname `Buildicy ERP` → register
3. Copy the new SDK config values

**Restrict the new key (Google Cloud Console):**
1. APIs & Services → Credentials → find the Browser key
2. Application restrictions → HTTP referrers → add:
   - `erp-buildicy.firebaseapp.com/*`
   - `erp-buildicy.web.app/*`
   - `localhost:5173/*`
   - `localhost:3000/*`
   - `127.0.0.1:5173/*`
   - `buildicy-erp.vercel.app/*` (after Vercel deploy)
   - `*.vercel.app/*` (preview deploys)
3. API restrictions → Restrict key → check: Cloud Firestore API, Firebase Installations API, Identity Toolkit API, Firebase App Check API

**Generate service account:**
1. Project settings → Service Accounts → Generate new private key
2. Save as `functions/service-account.json` (gitignored)

### 2. Resend (https://resend.com/)

1. Sign up with company email
2. Domains → Add domain → `mg.buildicy.com` (or your subdomain)
3. Add the DNS records Resend shows (TXT for SPF/DKIM)
4. Verify the domain
5. API Keys → Create API key → name `buildicy-erp-functions` → permission: Sending access
6. Copy the `re_...` key

### 3. Add secrets to Cloud Functions

```bash
firebase functions:secrets:set RESEND_API_KEY
# paste the re_... key when prompted
```

### 4. Vercel (https://vercel.com/)

1. Sign up with GitHub
2. Add New → Project → import `Buildicy_erp` repo
3. Framework preset: Vite (auto-detected)
4. Environment Variables — add each `VITE_*` value:
   - `VITE_FIREBASE_API_KEY` (the rotated key)
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_USE_FIREBASE_AUTH=true`
   - `VITE_USE_FIRESTORE_DATA=true`
   - `VITE_USE_CF_WRITES=true`
   - `VITE_USE_APP_CHECK=false`
   - `VITE_RECAPTCHA_SITE_KEY=`
5. Deploy

### 5. Firebase Auth authorized domains

1. Firebase Console → Authentication → Settings → Authorized Domains
2. Add `buildicy-erp.vercel.app`

### 6. Seed Auth users (locally once)

```bash
GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json \
  node functions/scripts/seedAuthUsers.js
```

This creates the 9 Firebase Auth users, sets `roleTier` claims, and writes their profile docs.

### 7. Seed Firestore data (optional, locally)

```bash
GOOGLE_APPLICATION_CREDENTIALS=functions/service-account.json \
  node scripts/seedFirestore.js
```

Writes the 9 user profile docs (and any future projects/tasks/meetings) to Firestore.

### 8. Deploy Cloud Functions

```bash
firebase deploy --only functions
firebase deploy --only firestore:rules,firestore:indexes
```

### 9. Verify

Visit `https://buildicy-erp.vercel.app`. Log in with `prajwal@company.com / Admin@1234`. Check that:
- Dashboard loads with current user
- Tasks/projects render from Firestore (DevTools → Network → Firestore)
- Status changes email arrives via Resend (check inbox of the assigned user)
- Audit logs appear under admin view
- All Phase 5+ writes go through Cloud Functions (no direct Firestore writes from SPA console)

---

## One-time break-glass scripts

Kept under `functions/scripts/`, never in the SPA:

- `resetPassword.js` — admin SDK: reset any user's password
- `setRole.js` — admin SDK: change `roleTier` custom claim
- `seedAuthUsers.js` — admin SDK: re-create 9 Auth users + claims
- `seedFirestore.js` — admin SDK: re-seed profile docs
- `checkLeak.js` — secret-leak detector (run in CI)

These let you recover from any auth-side incident without redeploying the SPA.