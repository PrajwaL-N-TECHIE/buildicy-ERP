# Buildicy ERP — Backend Migration Plan

**Status**: Phase 0 complete. Phases 1–9 tracked below.
**Goal**: move from `localStorage` as truth → Firestore as truth, with Cloud Functions owning all writes, real-time listeners replacing WebSocket, `localStorage` reduced to an offline cache. All on Firebase Spark (free tier).

---

## North-star architecture (post Phase 9)

```
                     ┌────────────────────────────────────────────────────────┐
                     │                Firebase Project: erp-buildicy           │
                     │                                                        │
   ┌─────────┐       │   ┌──────────────────┐        ┌──────────────────────┐  │
   │ Browser │──TLS──┼──▶│  Firebase Auth   │──JWT──▶│  Custom Claims       │  │
   │ (SPA)   │       │   │  Email/Password  │        │  { roleTier }        │  │
   └────┬────┘       │   └──────────────────┘        └──────────────────────┘  │
        │            │                                                        │
        │            │   ┌──────────────────┐        ┌──────────────────────┐  │
        │──HTTPS─────┼──▶│   Firestore      │◀─rules─│  firestore.rules     │  │
        │            │   │   (truth)        │        │  (deny-by-default)   │  │
        │            │   └────────┬─────────┘        └──────────────────────┘  │
        │            │            │                       ▲                   │
        │            │            │ realtime              │                   │
        │            │            ▼                       │                   │
        │ ◀──ws/h2────│    ┌──────────────────┐   ┌──────┴────────────────┐  │
        │  (long-poll │    │  onSnapshot      │   │  Cloud Functions       │  │
        │   fallback) │    │  via react-query │   │  (Gen 2, Node 20)     │  │
        │            │    └──────────────────┘   │                        │  │
        │            │                            │  callable:             │  │
        │            │                            │   createTask           │  │
        │            │                            │   updateTaskStatus     │  │
        │            │                            │   reviewTaskByReviewer │  │
        │            │                            │   reviewTaskByAdmin    │  │
        │            │                            │   updateProjectDeadline│  │
        │            │                            │   scheduleMeeting      │  │
        │            │                            │   deleteMeeting        │  │
        │            │                            │   checkIn / checkOut   │  │
        │            │                            │                        │  │
        │            │                            │  triggers:             │  │
        │            │                            │   onTaskWritten        │  │
        │            │                            │   onProjectWritten     │  │
        │            │                            │   onMeetingCreated     │  │
        │            │                            │   onAuthCreate (claims)│  │
        │            │                            │   onChatMessageCreate  │  │
        │            │                            │   auditLog on writes   │  │
        │            │                            │   scheduledDigest      │  │
        │            │                            └────────┬───────────────┘  │
        │            │                                     │                  │
        │            │                                     ▼                  │
        │            │                            ┌────────────────────────┐  │
        │            │                            │  /mail (Trigger Email  │  │
        │            │                            │   Extension)           │  │
        │            │                            └─────────┬──────────────┘  │
        │            │                                      │                 │
        │            │                                      ▼                 │
        │            │                            ┌────────────────────────┐  │
        │            │                            │  Gmail SMTP via        │  │
        │            │                            │  Firebase Extension    │  │
        │            │                            └────────────────────────┘  │
        └────────────┘                                                        │
                     └────────────────────────────────────────────────────────┘
                                       │
                          App Check (reCAPTCHA v3) on every entry
```

---

## Phases

### Phase 0 — Security lockdown ✅ DONE

**Goal**: stop the bleeding. Live API key in git, no `.gitignore`, `/mail` allows any signed-in user to spam mail, `seedFirestore.js` uses web SDK.

**Changes shipped**:

- `.gitignore` — comprehensive (service-account JSON, `.env*`, build outputs, Firebase logs)
- `firestore.rules` — full rewrite, default-deny, RBAC for users/projects/tasks/meetings/audit_logs/attendance/chat/mail/notification_log/client_logs. `/mail` is server-only (`allow write: if false`).
- `firebase.json` — added emulators config (auth:9099, firestore:8080, functions:5001, hosting:5000, ui:4000)
- `scripts/seedFirestore.js` — rewritten to use `firebase-admin` + `GOOGLE_APPLICATION_CREDENTIALS` env var, no hardcoded web SDK config
- `functions/scripts/checkLeak.js` — secret-leak detector (HIGH severity for `AIza*` and `service-account*.json` file paths; LOW for the demo date bug scheduled for Phase 3)
- `functions/src/seed/seedUsers.js` — canonical SEED_USERS / SEED_PROJECTS / SEED_TASKS / SEED_MEETINGS / SEED_AUDIT_LOGS / SEED_CHAT_CHANNELS source-of-truth (CommonJS, no Firebase SDK dependency)
- `.env.example` — full flag set documented (`VITE_USE_FIREBASE_AUTH`, `VITE_USE_FIRESTORE_DATA`, `VITE_USE_CF_WRITES`, `VITE_USE_APP_CHECK`)

**Acceptance criteria met**:

- ✅ No live API key in `HEAD` reach (0 `AIza` matches in tracked files)
- ✅ Rules are deny-by-default with explicit allow rules per role
- ✅ Service-account pattern enforced via `.gitignore` + leak detector
- ✅ Emulators wired for local dev
- ✅ `.env.example` documents all phase flags

**Manual steps remaining** (require Firebase Console access, not code):

1. Rotate the API key in Firebase Console → APIs & Services → Credentials
2. Update `.env` with the rotated key value
3. Add HTTP referrer restrictions on the new key
4. Install the Trigger Email extension: `firebase ext:install firebase/firestore-send-email --project=erp-buildicy`
5. Generate service account JSON and save as `functions/service-account.json`

---

### Phase 1 — Firebase Auth wiring (next, 6h)

**Goal**: replace `loginAsUser` (the unauthenticated persona switcher) and `loginWithCredentials` (plaintext password check) with real Firebase Auth + custom claims.

**Files to create**:

- `functions/scripts/seedAuthUsers.js` — admin SDK script that creates 9 Firebase Auth users, sets `roleTier` custom claim, writes `users/{uid}` profile doc
- `src/auth/AuthContext.tsx` — slim replacement for the god-object `src/context/AuthContext.tsx`
- `src/auth/useRequireRole.ts` — role guard hook
- `src/auth/passwordRules.ts` — minimum-length + complexity check

**Files to edit**:

- `src/views/LoginView.tsx` — replace email/password form with `signInWithEmailAndPassword`. Dev-only persona switcher gated behind `import.meta.env.DEV && VITE_USE_FIREBASE_AUTH !== 'true'`
- `src/App.tsx` — swap `AuthProvider` import to the new context
- `src/firebase/config.ts` — keep Firebase init only; `SEED_*` arrays remain until Phase 8

**Files to delete**:

- `src/context/AuthContext.tsx` (replaced by `src/auth/AuthContext.tsx`)

**Acceptance criteria**:

- 9 users can sign in with email + password
- `loginAsUser` cannot be invoked in production builds
- AuthContext has ≤ 4 fields (currentUser, fbUser, loading, roleTier)
- Custom claims visible after `getIdToken(true)` refresh

**Rollback**: flip `VITE_USE_FIREBASE_AUTH=false`, redeploy. LS persona switcher takes over.

---

### Phase 2 — Firestore data layer (10h)

**Goal**: SPA reads collections from Firestore via `onSnapshot`. React Query + IndexedDB persist for offline cache. Dual-write window behind `VITE_USE_FIRESTORE_DATA` flag.

**New dependencies**:

```json
"@tanstack/react-query": "^5.51.0",
"@tanstack/react-query-persist-client": "^5.51.0",
"@tanstack/query-async-storage-persister": "^5.51.0",
"idb-keyval": "^6.2.1",
"firebase-functions": "^5.0.1"
```

**Files to create**:

- `src/data/firestore.ts` — shared helpers
- `src/data/{users,projects,tasks,meetings,attendance,auditLogs,chat,mail}Repo.ts`
- `src/hooks/{queryClient,useUsers,useProjects,useTasks,useMeetings,useAuditLogs,useChatRealtime,useAttendance}.ts`
- `src/data/localStorageMirror.ts` — dual-write helper used during Phase 2-4

**Firestore subcollection layout (locked in Phase 3)**:

```
chat/
  _meta/channels/{channelId}        # channel name + memberIds
  channels/{channelId}/messages/{msgId}
  dms/{dmId}/messages/{msgId}        # dmId = sorted(uidA,uidB).join('_')

attendance/
  users/{uid}/sessions/{YYYY-MM-DD}  # one doc per day; sessions[] inside
```

**Acceptance criteria**:

- Reads from Firestore visible in real time across two tabs
- Offline cache works (DevTools → Network → Offline → UI still functional)
- Flipping `VITE_USE_FIRESTORE_DATA=false` reverts to LS without code change

**Rollback**: flip flag, redeploy. LS is still being dual-written, so no data loss.

---

### Phase 3 — Migrate chat & attendance (5h)

**Goal**: replace WebSocket with Firestore realtime listeners. Subcollections above. Fix hardcoded `'2026-08-21'` bug (R10 in risk register).

**Files to create**:

- `src/data/chatRepo.ts` — full implementation
- `src/data/attendanceRepo.ts` — full implementation

**Files to edit**:

- `src/views/TeamChatView.tsx` — replace `webSocketService.onMessage(...)` with `useChatRealtime(...)`
- `src/components/AttendanceTracker.tsx` — replace LS reads with `attendanceRepo`

**Files to delete**:

- `src/services/websocket.ts`

**Hardcoded date fix**:

```bash
grep -RIn "'2026-08-21'" src/
```

Each hit gets replaced with `new Date().toISOString().slice(0,10)` for runtime code, or `admin.firestore.FieldValue.serverTimestamp()` for seed scripts.

**Acceptance criteria**:

- Chat works between two tabs with no WebSocket connection
- Attendance persists per-day subcollections
- Zero `'2026-08-21'` literals in `src/` runtime code (the leak detector enforces this)

**Rollback**: restore `src/services/websocket.ts` from git history.

---

### Phase 4 — Kill duplicate mail writes (3h)

**Goal**: today every task event writes a `mail` doc twice (once from `src/firebase/notifications.ts`, once from `functions/index.js`). Collapse to server-only.

**Files to create**:

- `functions/src/mail.js` — single `writeMailDoc(...)` helper used by all triggers
- `functions/src/notifications/templates/{taskAssigned,taskSentBack,taskReviewerApproved,taskAdminApproved,projectDeadlineUpdated,meetingScheduled,overdueDigest}.js`

**Files to edit**:

- `src/firebase/notifications.ts` — strip `addDoc(collection(db,'mail'), ...)`. Rename file in Phase 7.

**Acceptance criteria**:

- Exactly 1 mail doc per notification event (verifiable in `/mail` collection)
- Templates live under `functions/src/notifications/templates/`

**Rollback**: restore `addDoc` call from git history.

---

### Phase 5 — Server-side writes via Cloud Functions (14h)

**Goal**: SPA cannot mutate tasks/projects/meetings/attendance directly. Callable Cloud Functions validate state machine and write via admin SDK.

**New `functions/` layout**:

```
functions/
  index.js                          # thin re-export of all handlers
  src/
    admin.js                        # admin.initializeApp({...}); exports db
    auth.js                         # requireRole(actor, roles[])
    mail.js
    notifications/
      templates/...
      dispatchers.js
    tasks/
      createTask.js                 # callable
      updateTaskStatus.js           # callable
      reviewTaskByReviewer.js       # callable
      reviewTaskByAdmin.js          # callable
      stateMachine.js               # canTransition(from, to, actorRole)
    projects/
      updateDeadline.js
    meetings/
      scheduleMeeting.js
      deleteMeeting.js
    attendance/
      checkIn.js
      checkOut.js
    audit/
      onAnyWrite.js
    triggers/
      onAuthCreate.js               # mirror auth user -> users/{uid}
      onTaskWritten.js
      onProjectWritten.js
      onMeetingCreated.js
      onChatMessageCreate.js
      scheduledDigest.js            # 09:00 IST weekdays
  test/                             # vitest + @firebase/rules-unit-testing
  scripts/
    seedAuthUsers.js
    seedFirestore.js (legacy alias)
    checkLeak.js
```

**State machine** (lives in `functions/src/tasks/stateMachine.js`):

```js
const ALLOWED = {
  contributor: { 'Not Started':['In Progress'], 'In Progress':['Submitted'] },
  reviewer:    { 'Submitted':['In Progress','Pending Admin'] },
  admin:       { 'Pending Admin':['In Progress','Completed'], 'Completed':[] },
};
```

**Acceptance criteria**:

- As contributor, drag task to "Completed" → server rejects with `permission-denied`
- As reviewer, drag "Submitted" to "In Progress" → success, mail sent (exactly once)
- DevTools console cannot mutate Firestore directly

**Rollback**: flip `VITE_USE_CF_WRITES=false`. Repos take over again.

---

### Phase 6 — Decommission Express server (2h)

**Files to delete**:

- `server/index.js` (whole `server/` directory)
- `src/services/websocket.ts` (already deleted in Phase 3 — verify)

**Files to edit**:

- `package.json` — remove `ws`, `@types/ws`. Add `emulators`, `functions:deploy` scripts.
- `.env` — delete `VITE_BACKEND_API_URL`
- `vite.config.ts` — remove any dev-proxy to `:5000`

**Acceptance criteria**:

- `grep -RIn "ws://\|wss://\|localhost:5000" src/` returns 0 hits
- App fully functional with no Express process running

**Rollback**: restore `server/index.js` from git history.

---

### Phase 7 — Retire localStorage (8h)

**Files to delete**:

- `src/firebase/config.ts` — strip `getStored*`/`save*`/`SEED_*`. Keep only Firebase init.
- `src/data/localStorageMirror.ts`

**Files to edit**:

- `App.tsx` — add one-shot LS→Firestore migration guarded by `erp_migrated_v2` flag
- All view files — remove `localStorage.getItem('erp_*')` reads

**Acceptance criteria**:

- `grep -RIn "localStorage\.getItem('erp_" src/` returns 0 hits
- Fresh incognito user: app works, no LS data present
- Existing user with LS data: migrates on first load

**Rollback**: LS data remains in the browser. Re-introducing `getStored*` falls back.

---

### Phase 8 — Audit logs server-side (4h)

**Goal**: tamper-proof audit trail.

**Files to create**:

- `functions/src/audit/onAnyWrite.js` — generic `onDocumentWritten` that appends to `audit_logs`

**Rules update** (already shipped in Phase 0):

```rules
match /audit_logs/{id} {
  allow read: if isAuthenticated();
  allow write: if false;
}
```

**Acceptance criteria**:

- Trigger a task transition → audit doc with correct actor + action
- `db.collection('audit_logs').add(...)` from DevTools → denied

---

### Phase 9 — Hardening (6h)

**Files to create**:

- `functions/src/notifications/idempotency.js` — `notification_log` collection dedupe

**Acceptance criteria**:

- App Check enforced (Firestore + Functions reject unsigned traffic)
- Same task transition triggered twice → 1 mail, 1 notification_log entry
- Scheduled overdue digest lands in founder inboxes 09:00 IST weekdays
- Rules test suite green via `npm run test:rules`

---

## Dependency additions per phase

| Phase | Add | Versions |
|---|---|---|
| 0 | — | — |
| 1 | — | — |
| 2 | `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `idb-keyval`, `firebase-functions` | `^5.51.0`, `^5.51.0`, `^5.51.0`, `^6.2.1`, `^5.0.1` |
| 3 | — | — |
| 4 | — | — |
| 5 | — | — |
| 6 | Remove `ws`, `@types/ws` | — |
| 7 | — | — |
| 8 | — | — |
| 9 | `vitest` (dev), `@firebase/rules-unit-testing` (dev) | `^1.6.0`, `^3.0.2` |

`functions/package.json` target shape:

```json
{
  "name": "functions",
  "engines": { "node": "20" },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.4.0",
    "firebase-functions": "^5.0.1"
  },
  "devDependencies": {
    "@firebase/rules-unit-testing": "^3.0.2",
    "vitest": "^1.6.0"
  },
  "private": true
}
```

---

## Final `firestore.rules` summary

Phase 0 rules ship today. Phase 5 will tighten `tasks`/`projects`/`meetings`/`attendance` writes to `allow write: if false`. Phase 8 makes `audit_logs` immutable from clients. Defaults deny everything.

---

## Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | Live API key rotated breaks prod before SPA redeploys | Update `.env`, redeploy hosting **before** deleting old key in console. Keep both keys valid for 24h. |
| R2 | Trigger Email free tier (100/day) exceeded | Phase 9 idempotency + digest throttle. Budget alert. |
| R3 | Two tabs writing same task create race | Tasks use auto-IDs; updates use LWW on `updatedAt`. State machine validates via callable. |
| R4 | Migration overwrites newer Firestore data with older LS data | `{ merge: true }` + `erp_migrated_v2` flag. Snapshot Firestore before running. |
| R5 | Callable cold-start latency >5s | `minInstances: 0` (free). Document acceptable for ERP usage. |
| R6 | Custom claims not refreshed after change | Client uses `getIdToken(true)` on app boot. |
| R7 | Seed script leaks PII into mail docs | Mail templates only include `displayName` + `email`. |
| R8 | `loginAsUser` accidentally ships | Gate behind `import.meta.env.DEV`. CI test asserts. |
| R9 | App Check rejects all traffic after enforce toggle | Toggle on staging first; monitor reject rate. |
| R10 | Hardcoded `'2026-08-21'` survives migration | `checkLeak.js` enforces after Phase 3. |
| R11 | Users locked out after password reset bug | Admin SDK `resetPassword.js` script for break-glass. |
| R12 | Concurrent Firestore listeners cause quota burn | `queryClient` dedupes via `queryKey`. |

---

## Estimated total effort

~60 hours for one engineer, phased over ~6 weeks. Each phase is independently shippable behind a flag.