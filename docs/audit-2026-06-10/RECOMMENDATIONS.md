# RECOMMENDATIONS — Pinbox Alternative (Audit 2026-06-10)

Prioritized, grouped into approval bundles. Effort: Quick (<30 min) / Medium (<half day) / Large.
**STATUS 2026-06-10: Bundles A, B, C approved and implemented on branch `optimization/fixes` — see OPTIMIZATION_COMPLETE.md. D and E remain open.**

---

## Bundle A — CRITICAL SECURITY (do first)

### A1: Rotate + scrub leaked `REPORTS_API_KEY`
Priority: P1 · Effort: Quick (rotation) + Medium (doc scrub)
Problem: literal key committed in 8+ docs; unlocks reports, analytics (customer PII), sync, and the feedback-wipe endpoint.
Fix: set new value in Railway + GitHub Actions secret; replace literals in docs with env-var name.
Files: CHANGELOG.md:113, PROGRESS.md:235, TROUBLESHOOTING.md:41, STATUS.md, MISTAKES.md, RAILWAY_CHEATSHEET.md, docs/ANALYST_POWER_BI_MESSAGE.md, docs/superpowers/plans/*

### A2: Make `repair-a5-links` non-destructive by default
Priority: P1 · Effort: Quick
Problem: empty body → `tx.feedback.deleteMany({})` wipes ALL feedback.
Fix: default `clearFeedback=false`; scope deletion to affected stores; require explicit confirm token.
Files: app/src/app/api/admin/repair-a5-links/route.ts:15,39-42

### A3: Remove hardcoded `<ADMIN_DIAG_KEY>` key; move to env (or delete routes)
Priority: P1 · Effort: Quick
Files: app/src/app/api/admin/qr-check/route.ts:7,21; api/admin/create-missing-stores/route.ts:5,18; RAILWAY_CHEATSHEET.md

### A4: Strong `TEAM_PASSWORD` + scrub `12345` from docs + login rate limit
Priority: P1 · Effort: Quick (password) / Medium (rate limit)
Files: Railway env; DECISIONS.md:71-73, PROGRESS.md:99, CHANGELOG.md:51; app/src/app/login/actions.ts

### A5: Stop shipping `.env*` secrets in deploy build context
Priority: P1 · Effort: Quick
Fix: create `app/.dockerignore`; add `.env*`, `dev.db`, `scripts/`, `test-results/`, `*.tsbuildinfo` ; extend `app/.railwayignore`; delete stale `app/.env.tmp` from disk.
Files: app/Dockerfile:13, app/.railwayignore

### A6: Fail closed everywhere
Priority: P1/P2 · Effort: Quick
Fix: reviews ingest + telegram webhook reject when secret env unset; auth bypass refused when `NODE_ENV==='production'` (and never on mere `NODE_ENV !== 'production'` for a deployed host); Telegram allow-list empty → deny.
Files: app/src/app/api/reviews/ingest/route.ts:19-23; api/telegram/webhook/route.ts:28-35; app/src/lib/auth.ts:36-46; app/src/lib/reviews.ts:205-211

### A7: Guard slug-writing scripts + DB-level slug trigger
Priority: P1 · Effort: Medium
Fix: scripts import the guarded client; repair script requires explicit flag + refuses prod URL unless confirmed; add Postgres `BEFORE UPDATE` trigger raising on slug change (covers raw SQL/nested writes forever).
Files: app/scripts/repair-a5-poster-store-links.mjs:167; app/src/lib/db.ts:19-43

---

## Bundle B — REPORT CORRECTNESS

### B1: Fix weekly range end boundary (`end: new Date()` → `toUtc(todayT)`)
Priority: P2 · Effort: Quick · Files: app/src/lib/report-builder.ts:95

### B2: Manager-sync sanity guard (abort on implausibly few matches)
Priority: P2 · Effort: Quick · Files: app/src/lib/manager-sync.ts:85-98

### B3: Weekly label day-"0" + Dec→Jan year fix
Priority: P3 · Effort: Quick · Files: app/src/lib/report-builder.ts:91,94

### B4: Show tm=null zero-vote stores in a "Без менеджера" block
Priority: P3 · Effort: Quick · Files: app/src/lib/report-format.ts:79-89

### B5: Report idempotency / safer curl retry
Priority: P3 · Effort: Medium · Files: app/src/app/api/reports/daily/route.ts; .github/workflows/daily-telegram-report.yml:38-43

---

## Bundle C — VOTING FLOW RELIABILITY (lost feedback/alerts)

### C1: Handle errors in voting client (comment result checked; try/catch/finally; localized messages)
Priority: P2 · Effort: Quick/Medium · Files: app/src/app/[slug]/client.tsx:121-140,179

### C2: Check `res.ok` + log `allSettled` rejections in Telegram alert path
Priority: P2 · Effort: Quick · Files: app/src/lib/notifications.ts:102-120,147-163

### C3: Alert trigger on min-rating too (`avg<=3 || min<=2`), decided server-side
Priority: P3 · Effort: Medium · Files: client.tsx:107; actions.ts:142

### C4: Prefer server cookie over client deviceId; validate format
Priority: P3 · Effort: Quick · Files: app/src/lib/feedback-protection.ts:38-48

### C5: Durable alert debounce (DB outbox or SIGTERM flush) — fixes deploy-window alert loss
Priority: P2 · Effort: Medium/Large · Files: app/src/lib/feedback-alert-buffer.ts

### C6: Scan counter: fire-and-forget via `after()`, filter bots/health-check
Priority: P3 · Effort: Quick · Files: app/src/app/[slug]/page.tsx:38-44

### C7: Fix `-comment` shared deviceId (state instead of localStorage re-read)
Priority: P3 · Effort: Quick · Files: client.tsx:135-136

---

## Bundle D — ADMIN FLOW FIXES

### D1: CSV import "create-only" must skip existing stores (currently duplicates ALL)
Priority: P2 · Effort: Quick · Files: app/src/app/admin/stores/import/actions.ts:67-71

### D2: Make archived stores restorable + confirm dialog on archive
Priority: P2 · Effort: Medium · Files: app/src/lib/store-access.ts; admin/stores UI

### D3: Tenant-scope discovery page + ownership check in acceptCandidate + transaction
Priority: P2 · Effort: Quick · Files: discovery/page.tsx:7-13; discovery/actions.ts:31-61

### D4: Disable mock Yandex/2GIS candidates (label "not implemented", block accept)
Priority: P2 · Effort: Quick · Files: app/src/lib/connectors/yandex.ts, twogis.ts

### D5: createStore: full transaction + duplicate-name check; validate store edits
Priority: P2/P3 · Effort: Medium · Files: stores/new/actions.ts:38-103; stores/[id]/actions.ts:30-37

### D6: Surface FAILED syncs; discovery error reporting + fetch timeouts; import tx timeout 60s
Priority: P3 · Effort: Medium · Files: [id]/actions.ts:124-146; discovery.ts:59-62; google-real.ts; import/actions.ts:61

### D7: Poster QR base URL from `PUBLIC_BASE_URL` env, not Host header
Priority: P3 · Effort: Quick · Files: app/src/app/poster/[slug]/page.tsx:43-47

---

## Bundle E — CODE HEALTH / CLEANUP

### E1: Fix `npm test` (move `_render_preview.test.ts` out of the suite)
Priority: P2 · Effort: Quick

### E2: Delete junk files + extend .gitignore; commit the 53-file keep-list
Priority: P2 · Effort: Quick/Medium (per junk table in CODE_AUDIT.md)

### E3: Consolidate Telegram client, Tashkent helpers, escapeHtml into shared libs
Priority: P3 · Effort: Medium

### E4: Remove stale `app/src/lib/prisma-client/` and dead `VotingPage.tsx`; delete root Dockerfile
Priority: P3 · Effort: Quick

### E5: Add tests for the critical untested logic (slug guard, report ranges, feedback protection, VOTE_ROW_FILTER convention)
Priority: P2 · Effort: Large

### E6: Accessibility pass on voting UI (aria-labels, radiogroup, aria-live)
Priority: P3 · Effort: Quick/Medium · Files: client.tsx:61-79,162-178

---

## Suggested order

1. **Bundle A** (A1–A6 same day; A7 next) — closes active exposure.
2. **B1+B2** — wrong numbers ship every Monday; sync wipe already happened once.
3. **C1+C2+D1** — stops silent data loss with tiny diffs.
4. Rest of C/D, then E.
