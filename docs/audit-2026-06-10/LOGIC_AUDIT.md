# LOGIC_AUDIT — Pinbox Alternative (Audit 2026-06-10)

All findings confirmed in code by reading the files. No code modified.

---

## P1 — Critical (security / data destruction)

### Issue #1: Production `REPORTS_API_KEY` committed to git
- Location: CHANGELOG.md:113, PROGRESS.md:235, TROUBLESHOOTING.md:41 (+ STATUS.md, MISTAKES.md, RAILWAY_CHEATSHEET.md, docs/ANALYST_POWER_BI_MESSAGE.md, docs/superpowers/plans/*)
- Expected: secrets referenced by name only in docs.
- Actual: the literal key value is in committed markdown. It unlocks `/api/reports/*`, `/api/analytics/stores`, `/api/analytics/feedback` (raw customer comments + contact PII), `/api/admin/sync-managers`, `/api/admin/repair-a5-links`.
- Impact: anyone with repo access can exfiltrate all customer feedback/PII, spam the live Telegram channel, and (via Issue #2) wipe all feedback.
- Fix: rotate key in Railway; scrub value from docs (and ideally git history); docs reference env var name only.

### Issue #2: `repair-a5-links` deletes ALL feedback by default
- Location: app/src/app/api/admin/repair-a5-links/route.ts:15 (`let clearFeedback = true;`), :39-42 (`tx.feedback.deleteMany({})`)
- Expected: a repair endpoint never destroys data unless explicitly told.
- Actual: empty/invalid body keeps the `true` default → entire `Feedback` table wiped, not scoped to the 2 Glotok stores. Gated only by the leaked key (Issue #1). The `db-repair` skill automates calling it.
- Impact: one keyed POST with no body = irreversible loss of all customer votes/comments.
- Fix: default `clearFeedback = false`; scope deletion to affected store IDs; require explicit confirm token.

### Issue #3: Hardcoded admin key `<ADMIN_DIAG_KEY>` for raw-SQL/diagnostic routes
- Location: app/src/app/api/admin/qr-check/route.ts:7,21; app/src/app/api/admin/create-missing-stores/route.ts:5,18 (also in RAILWAY_CHEATSHEET.md)
- Actual: key is a source-code literal accepted via query string. POST qr-check runs `$executeRawUnsafe` DDL on prod (bypasses slug guard entirely); GET dumps the full frozen-slug map + audit logs; create-missing-stores creates stores/QRs.
- Fix: move to env var (or delete these one-off routes); remove value from docs.

### Issue #4: Admin password `TEAM_PASSWORD=12345` committed and trivially guessable
- Location: DECISIONS.md:71-73, PROGRESS.md:99, CHANGELOG.md:51 (+others); login at app/src/app/login/actions.ts:19-30 (no rate limit)
- Impact: full admin takeover of the production dashboard.
- Fix: set a strong password in Railway; scrub from docs; add login rate limiting.

### Issue #5: Secrets shipped in Railway build context (no .dockerignore)
- Location: app/Dockerfile:13 (`COPY . .`); `app/.dockerignore` missing; app/.railwayignore lacks `.env*`
- Actual: `app/.env`, `.env.local`, `.env.tmp` (real bot token, Google refresh token, session secret, API keys) upload with every deploy and land in builder image layers.
- Fix: add `.dockerignore` (`.env*`, `dev.db`, `scripts/`, `test-results/`, `*.tsbuildinfo`); extend `.railwayignore`.

### Issue #6: Slug-writing repair script runs with unguarded Prisma client
- Location: app/scripts/repair-a5-poster-store-links.mjs:167 (own `new PrismaClient()`), writes `slug:` at :159,221,232; ~12 scripts total bypass the db.ts guard
- Impact: one accidental run against prod `DATABASE_URL` can break printed posters — the exact forbidden operation in CLAUDE.md.
- Fix: shared guarded client for scripts; explicit confirmation flag + prod-URL refusal in the repair script; DB-level trigger on `"QRCode".slug` as final backstop.

---

## P2 — High (wrong data / lost data / auth gaps)

### Issue #7: Weekly report double-counts Monday 00:00–08:00
- Location: app/src/lib/report-builder.ts:95 (`end: new Date()` instead of `toUtc(todayT)`)
- Impact: Monday-morning votes counted in two consecutive weekly reports; totals don't match the labeled range.

### Issue #8: Manager sync can silently wipe ALL TM assignments
- Location: app/src/lib/manager-sync.ts:85-98; column positions hardcoded at :50
- Actual: a sync resolving 0 matches is not an error → every store's `territorialManager` set to null. Already happened once (documented in the file's own comment). A sheet tab/column reshuffle reproduces it.
- Fix: abort when matches < sanity threshold (e.g. <50% of active stores).

### Issue #9: Comment submission silently discards server errors
- Location: app/src/app/[slug]/client.tsx:137-140
- Actual: result of `submitFeedback` ignored; thank-you shown unconditionally. Oversized/rate-limited comments (the most valuable complaints) silently vanish.

### Issue #10: No try/catch around voting server-action calls
- Location: app/src/app/[slug]/client.tsx:121-122, :137
- Actual: network drop / DB failure → unhandled rejection → submit button frozen on "..." with no recovery. `feedback.create` (actions.ts:123) also not wrapped in `withDbRetry`.

### Issue #11: Telegram alert failures doubly swallowed
- Location: app/src/lib/notifications.ts:102-120 (no `res.ok` check), :147-154 (`Promise.allSettled` results never inspected — catch blocks are dead code)
- Impact: revoked token / 429 / deleted chat kills all low-score alerts with zero log trace.

### Issue #12: In-memory alert debounce loses alerts on deploy/restart
- Location: app/src/lib/feedback-alert-buffer.ts:9,22-23,58-64 (`unref()`d 30s timer, module-level Maps)
- Impact: nightly auto-deploys make alert loss a daily-real window; breaks with >1 replica.

### Issue #13: Auth fail-open paths
- Location: app/src/lib/auth.ts:36-46 (`NODE_ENV !== 'production'` OR `DISABLE_AUTH_FOR_TESTING` → auto-provision OWNER, works in prod); api/reviews/ingest/route.ts:19-23 and api/telegram/webhook/route.ts:28-35 (return `true` when secret env unset); reviews.ts:205-211 (Telegram user allow-list empty → allow all)
- Fix: fail closed everywhere; refuse bypass when NODE_ENV=production.

### Issue #14: CSV import "create-only" duplicates every existing store on re-run
- Location: app/src/app/admin/stores/import/actions.ts:67-71 (existing-store lookup only runs in `create-and-update` mode)
- Impact: re-upload duplicates all stores with brand-new QR slugs, splitting analytics/reports.

### Issue #15: Archived stores unrecoverable from UI
- Location: app/src/lib/store-access.ts:6,11 (`archivedAt: null` always); restore UI at stores/[id]/client.tsx:117-148 is dead code (page 404s first)
- Impact: accidental archive (no confirm dialog) kills a printed poster's page; recovery requires direct DB access.

### Issue #16: Discovery flow lacks tenant scoping and ownership checks
- Location: discovery/page.tsx:7-13 (no `requireCurrentUser`/tenant filter); discovery/actions.ts:31-51 (`acceptCandidate` doesn't verify candidate belongs to store; unguarded `JSON.parse`; 3 writes not in transaction)

### Issue #17: Yandex/2GIS connectors are hardcoded mocks accepted as real data
- Location: app/src/lib/connectors/yandex.ts:22-55; twogis.ts:14-17
- Impact: admins can persist fabricated platform links as CONNECTED.

### Issue #18: `createStore` partially non-transactional + no duplicate-name check
- Location: app/src/app/admin/stores/new/actions.ts:38-103 (platform links + audit outside tx → error → user retries → duplicate store)

---

## P3 — Medium

### Issue #19: Per-question 1★ can produce NO alert
- Location: client.tsx:107 (`Math.round(sum/3)`), actions.ts:142 (`rating <= 3`)
- Actual: [1,5,5] → avg 4 → no alert, no comment screen. Per-question breakdown parsed but never used for triggering.
- Fix: trigger on `avg <= 3 || min(ratings) <= 2`, decided server-side.

### Issue #20: 35-day device limit trivially bypassable
- Location: feedback-protection.ts:38-48 — client-supplied `deviceId` overrides the server cookie; no length/charset validation.

### Issue #21: Rate-limit checks read-then-write without transaction
- Location: actions.ts:36-121 vs create at :123 — parallel replays all pass the counts.

### Issue #22: Duplicate full alert if comment typed >5 min after vote
- Location: feedback-alert-buffer.ts:10,83-90 (`RECENTLY_FLUSHED_TTL_MS` expires while comment box has no timeout).

### Issue #23: Shared `-comment` deviceId when localStorage empty
- Location: client.tsx:135-136 + actions.ts:76-86 — Safari private mode users share literal deviceId `-comment`; second commenter per store blocked for 35 days, error silently dropped (Issue #9).

### Issue #24: Scan counter counts bots and is awaited before render
- Location: app/src/app/[slug]/page.tsx:38-44 — link previews/crawlers/health checks inflate scans; "non-blocking" comment is wrong (awaited → slower TTFB).

### Issue #25: Slug guard bypass gaps (hardening)
- Location: db.ts:19-43 — nested `store.update({qrCodes:{update}})`, `qRCode.delete`+recreate, `$executeRaw` not intercepted. No live caller exploits these.
- Fix: DB trigger `BEFORE UPDATE ON "QRCode"` raising when slug changes.

### Issue #26: Report duplication on curl retry
- Location: .github/workflows/daily-telegram-report.yml:38-43 (`--retry-all-errors --max-time 60`) + no idempotency in route — slow build or partial multi-part send → duplicate Telegram report.

### Issue #27: tm=null stores with 0 votes invisible in report
- Location: report-format.ts:79-89 — 2 real stores currently in this state; defeats the "shame silent stores" purpose.

### Issue #28: Discovery/sync errors swallowed; no fetch timeouts
- Location: discovery.ts:59-62; google-real.ts:178-185, no AbortSignal on any fetch; [id]/actions.ts:124-146 reports FAILED sync as success.

### Issue #29: English-only error messages to customers
- Location: actions.ts:33,44,57,86,111,114; validation.ts:92-103 — most common rejection (35-day repeat) shown in English to uz/ru customers.

### Issue #30: Accessibility blockers on voting UI
- Location: client.tsx:61-79 (stars unlabeled), :162-178 (textarea unlabeled), :179/:275 (errors not announced).

### Issue #31: Weekly label bugs
- Location: report-builder.ts:91 (`getUTCDate() - 1` → day "0" when Monday is the 1st; 2026-06-01 was a Monday), :94 (year from current date at Dec→Jan).

### Issue #32: Store edit has no input validation
- Location: stores/[id]/actions.ts:30-37 — empty name propagates; NaN coords → generic failure.

### Issue #33: Import transaction can exceed Prisma 5s default timeout
- Location: import/actions.ts:61-157 — ~40-row CSV on remote Postgres aborts whole import.

---

## P4 — Low

- `oneWeekAgo` variable is actually 35 days (actions.ts:77-78).
- `[ratings]` prefix in a typed comment spoofs vote-row format; breakdown values not range-checked (actions.ts:143, notifications.ts:69-71).
- Dead component `VotingPage.tsx` diverges from live UI; MEMORY.md points at it as canonical.
- Hardcoded config: alert thresholds, Telegram @usernames in notifications.ts:83/93, fallback hash salt `'pinbox-feedback'` (actions.ts:65 — weak default if env unset).
- Non-constant-time secret compares (report-builder.ts:260, login/actions.ts:24).
- HTML-escape vs padding order misaligns report columns for `& < >` names (report-format.ts:23-25).
- Single oversized TM section (>3900 chars) would throw instead of splitting (report-format.ts:96-107) — theoretical at 43 stores.
- `lat||NaN` falsy-zero bug (import/actions.ts:29-30) — irrelevant for Tashkent.
- Dashboard "Сканов" column mixes all-time scans with period votes (admin/page.tsx:109-239).
- Untracked local files contain real-looking Telegram bot tokens (prompts/PROMPT-03-telegram-reports.md:8, docs/superpowers/plans/2026-05-21-*.md:224) — not in git history, revoke/scrub.
