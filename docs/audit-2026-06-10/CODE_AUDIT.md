# CODE_AUDIT — Pinbox Alternative (Audit 2026-06-10)

## Build health (commands actually run)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ PASS — 0 errors |
| `npm run lint` | ✅ PASS — 0 errors, 3 `no-unused-vars` warnings (batch-reply-yandex-2025.mjs:77, google-real.ts:125,235) |
| `npm test` (vitest) | ❌ FAIL — 1 file / 1 test failed, 13 passed. `_render_preview.test.ts` requires live `GSA`/`DBURL` env → `SyntaxError: "undefined" is not valid JSON`. Suite is permanently red → no usable quality gate. |

## Broken test masquerading as a test

`app/src/lib/_render_preview.test.ts` connects to the production DB, calls live Google Sheets, writes `_report_preview.txt`. It is a preview script, not a test. Move to `scripts/` or `test.skipIf(!process.env.GSA)`.

## Duplication map

| What | Copies |
|---|---|
| Telegram sendMessage client | lib/reviews.ts:129 · lib/report-builder.ts:239 · lib/notifications.ts:112 · scripts/railway-night-deploy.ps1:62 — each with different error handling (only report-builder chunks long messages; notifications swallows HTTP errors) |
| Tashkent UTC+5 helpers | lib/report-builder.ts:54-60 · app/admin/page.tsx:21-27 · lib/dashboard-trends.ts:35-39 · refresh_reviews_dashboard.mjs:11 |
| `escapeHtml` | report-builder.ts:62 · report-format.ts:8 · scripts/generate-qr-poster.mjs:26 · scripts/generate-voting-design-html.mjs:22 |
| Raw `new PrismaClient()` (bypasses slug guard) | ~12 scripts + check-qr.mjs + refresh_reviews_dashboard.mjs + _render_preview.test.ts |
| Poster/QR generators | 5 overlapping .mjs scripts + generate-posters-pdf.py |
| `verify-flow.mjs` | scripts/ and app/scripts/ — byte-identical |
| Stale generated Prisma client | app/src/lib/prisma-client/ (15 tracked files, nothing imports it; real client is node_modules/@prisma/client) |

## Complexity hotspots (top offenders)

1. `app/src/components/VotingPage.tsx:89-652` — ~563 lines (and it's DEAD code — nothing imports it)
2. `app/src/components/QRPoster.tsx:91-395` — ~304 lines
3. `app/src/app/admin/page.tsx:89-325` — ~236 lines (fetch + aggregate + render in one)
4. `app/src/app/[slug]/client.tsx:85-308` — ~223 lines (live voting UI)
5. `app/src/app/poster/[slug]/page.tsx:28-220` — ~192 lines
- Runners-up: `submitFeedback` actions.ts:10-161 (~151 lines, the most critical write path, untestable as-is); `ingestMapReview` reviews.ts:213-346 (~133 lines)

## Error-handling hygiene

- ✅ Zero `any` types in app/src (excluding stale generated client); zero `process.env.X!` assertions; no env absence crashes the build.
- ❌ notifications.ts:102-120 — no `res.ok` check; :147-163 — `allSettled` results never inspected (dead catch blocks).
- ❌ api/telegram/webhook/route.ts:60-62 — bare catch returns `{ok:true}` unlogged.
- ⚠️ Weak fallback hash salt `'pinbox-feedback'` if `FEEDBACK_HASH_SALT`/`SESSION_SECRET` unset ([slug]/actions.ts:65).

## Deploy/image hygiene

- **No `app/.dockerignore`**; `.railwayignore` misses `.env*` → real secrets (`app/.env`, `.env.local`, `.env.tmp`) upload with every deploy and land in builder layers (P1).
- Two divergent Dockerfiles: root `Dockerfile` (alpine, runs `prisma migrate deploy` — contradicts the prod `db push` model that caused the 2026-06-09 outage) vs `app/Dockerfile` (the real one). Root `railway.json` untracked. Delete/redirect the root pair.
- Final runner image is clean (copies only .next/public/prisma/node_modules), but build context is not.

## Junk files

| File | Verdict |
|---|---|
| `console.log(JSON.stringify(row)))` (root, 0 bytes — accidental shell paste) | delete |
| `check-qr-codes.mjs` (root), `app/check-qr.mjs` (has latent `stores.rows.length` TypeError) | delete |
| `app/scripts/tmp-feedback-check.js`, `tmp-list-qr.js`, `scripts/tmp-*.cjs` (3) | delete |
| `app/src/lib/_render_preview.test.ts` | convert to script or delete |
| `logs/` (12 May deploy logs), `.playwright-mcp/`, `playwright_network.txt`, `_deploy_tmp/`, `.codex-temp/`, `RALPH_LOOP_*.md` | delete + gitignore |
| `app/.env.tmp` (stale copy WITH live secrets) | delete from disk |
| Root `Dockerfile` | delete or replace with redirect comment |
| `app/refresh_reviews_dashboard.mjs` (hardcoded `C:\Users\99893\...` path) | user decision: commit+move to scripts/ or delete |
| `posters/`, `posters_archive/`, `voting-page-designs/`, `test-output/`, `prompts/` | user decision (business archive vs junk) |
| `app/src/lib/prisma-client/` (stale generated, tracked) | `git rm -r` after tsc re-check |
| `app/src/components/VotingPage.tsx` (dead mockup, MEMORY.md points at it) | delete or move to docs/mockups/ |

## Untracked-work risk

53 untracked files include production-relevant items: `app/.railwayignore`, `app/scripts/repair-a5-poster-store-links.mjs`, `app/data/production-store-*.json`, root `railway.json`, `.claude/` config, 3 plan docs. A disk failure loses them. Commit the keep-list, gitignore the junk.

## Untested critical logic (zero tests today)

1. `lib/db.ts:19-43` — slug-protection extension (the #1 business invariant)
2. `lib/report-builder.ts:71-108` — daily/weekly/monthly range math (would have caught the weekly bug)
3. `lib/feedback-protection.ts` — device/IP hashing, anti-abuse
4. `lib/qr.ts` — slug generation collision path
5. `[slug]/actions.ts submitFeedback` — core write path (needs refactor to be testable)
6. `lib/feedback-filters.ts` VOTE_ROW_FILTER ↔ client.tsx prefix convention (a drift silently zeroes all reports)
7. `lib/feedback-alert-buffer.ts` + `notifications.ts parseRatingsBreakdown`
