# TEST_CASES — Pinbox Alternative (Audit 2026-06-10)

Status legend: ✅ pass · ❌ fail · ⚠️ risk. All paths verified by reading code (static trace).

## Customer voting journey (V)

| ID | Scenario | Expected | Path | Status |
|----|----------|----------|------|--------|
| V-001 | First scan, valid slug | Page renders, scans +1 atomically | app/src/app/[slug]/page.tsx:9-44 | ✅ |
| V-002 | Bot / link-preview / health-check GET | Not counted as scan | app/src/app/[slug]/page.tsx:39-44 | ⚠️ every GET counts (nightly health check adds 41 scans/run) |
| V-003 | Unknown slug | Graceful 404 | app/src/app/[slug]/page.tsx:22 | ✅ |
| V-004 | Archived store slug | "Магазин закрыт" card, not 404 | app/src/app/[slug]/page.tsx:25-36 | ✅ |
| V-005 | Happy-path vote | Stored correctly, Tashkent display time | app/src/app/[slug]/actions.ts:123-134 | ✅ |
| V-006 | Missing answers | Submit blocked | app/src/app/[slug]/client.tsx:96,280 | ✅ |
| V-007 | Rating 0/6/-1/non-numeric via direct action | Rejected | app/src/lib/validation.ts:94 | ✅ |
| V-008 | Comment >1000 chars | Rejected AND user told | client.tsx:137-140 | ❌ rejected server-side, client shows fake "Спасибо!" — comment lost |
| V-009 | Double-tap submit | One row | actions.ts:36-123 | ⚠️ no transaction; replay creates duplicate rows |
| V-010 | Replay with fresh client deviceId each time | Blocked by 35-day device rule | feedback-protection.ts:38-48 | ❌ server trusts client-supplied deviceId over its own cookie |
| V-011 | Repeat vote <35 days | Blocked, understandable message | actions.ts:85-87 | ⚠️ blocked but English-only message to uz/ru customers |
| V-012 | Script/HTML injection in comment | Inert | notifications.ts:112-119; React escaping | ✅ (P4: `[ratings]` prefix spoof possible) |
| V-013 | avg ≤3 → exactly one combined alert | One Telegram message | feedback-alert-buffer.ts:49-91 | ✅ (single replica, comment ≤30s) |
| V-014 | Comment typed >5 min after vote | Follow-up, not duplicate | feedback-alert-buffer.ts:83-90 | ❌ second full alert after TTL |
| V-015 | Ratings [1,5,5] (severe single category) | Alert fires | client.tsx:107; actions.ts:142 | ❌ avg rounds to 4 → no alert, no comment screen |
| V-016 | Telegram API 4xx / network error | Feedback saved + failure logged | notifications.ts:102-120,150 | ⚠️ saved ✅ but failure totally silent |
| V-017 | Deploy/restart during 30s debounce | Alert still delivered | feedback-alert-buffer.ts:58-64 | ❌ alert lost (nightly deploys make this daily-real) |
| V-018 | Multiple Railway replicas | Alert dedup still works | feedback-alert-buffer.ts:3-5 | ⚠️ documented single-replica assumption |
| V-019 | Server action throws (DB down) | Error shown, retry possible | client.tsx:121-122 | ❌ button frozen on "..." forever |
| V-020 | Any path rewriting QRCode.slug | Blocked | db.ts:19-43 | ✅ live code; ⚠️ guard gaps (nested/delete+create/raw SQL) |
| V-022 | Screen-reader user votes | Labeled stars, announced errors | client.tsx:61-79,162-178 | ❌ no aria-labels / aria-live |

## Reports & manager sync (R)

| ID | Scenario | Expected | Path | Status |
|----|----------|----------|------|--------|
| R-001 | Daily range on 1st of month | Covers last day of prev month | report-builder.ts:71-82 | ✅ |
| R-002 | Daily range on UTC server | TZ-independent math | report-builder.ts:54-77 | ✅ |
| R-003 | Weekly range end boundary | End = Monday 00:00 Tashkent | report-builder.ts:95 | ❌ end = `new Date()` → Monday 00:00–08:00 double-counted next week |
| R-004 | Weekly label when run on the 1st | "…31 мая" | report-builder.ts:91 | ❌ renders day "0" |
| R-006 | Monthly range, leap Feb / 31-day months | Correct boundaries | report-builder.ts:98-108 | ✅ |
| R-007 | Avg with 0 feedback | No NaN | report-format.ts:24-58 | ✅ |
| R-008 | Silent stores listed per TM | Every assigned 0-vote store shown | report-format.ts:42-50 | ✅ |
| R-009 | tm=null store with 0 votes | Visible somewhere | report-format.ts:79-89 | ❌ omitted entirely (2 real stores affected today) |
| R-011 | Sheet fetch throws mid-sync | Fallback snapshot, report unaffected | manager-sync.ts:75-79 | ✅ |
| R-012 | Sync succeeds but matches 0 rows | Abort, keep DB assignments | manager-sync.ts:85-98 | ❌ silently clears ALL TM assignments (already happened once) |
| R-013 | Sheet columns shift | Detected/aborted | manager-sync.ts:50 | ❌ all rows skipped → triggers R-012 |
| R-016 | Unauthorized POST to report endpoints | 401 | reports routes :16-21 | ✅ (but see S-001 — key leaked) |
| R-017 | REPORTS_API_KEY env missing | Fail closed | report-builder.ts:257-258 | ✅ |
| R-019 | Telegram 4xx on alert path | Logged | notifications.ts:103-121 | ❌ silent |
| R-020 | Report >4096 chars | Split on sections | report-format.ts:96-108 | ✅ |
| R-023 | curl timeout after partial send | No duplicate report | daily-telegram-report.yml:38-43 | ❌ `--retry-all-errors` re-sends |
| R-024 | 23:00 UTC backup cron double-fires report | Once daily | nightly-railway-deploy.yml (deploy only) | ✅ |

## Admin & store management (A)

| ID | Scenario | Expected | Path | Status |
|----|----------|----------|------|--------|
| A-002 | Create store with duplicate name | Rejected/warned | stores/new/actions.ts:38 | ❌ no check |
| A-004 | New store gets unique slug | Probe + DB @unique backstop | lib/qr.ts:4-14 | ✅ |
| A-007 | Platform-link/audit failure after create → retry | Atomic or idempotent | stores/new/actions.ts:63-99 | ❌ outside tx; retry duplicates store |
| A-009 | Edit store with invalid lat / empty name | Validation error | stores/[id]/actions.ts:30-37 | ❌ no validation |
| A-011 | Guard blocks nested slug update / qRCode.delete | Blocked | lib/db.ts:19-43 | ❌ not intercepted (no live caller) |
| A-012 | Re-run CSV import "create-only" | Existing stores skipped | import/actions.ts:67-71 | ❌ duplicates EVERY store with new slugs |
| A-013 | Re-run import "create-and-update" | Upsert by name, slug untouched | import/actions.ts:73-91 | ✅ |
| A-016 | Hard-delete store kills printed poster | No hard delete exists | stores/[id]/actions.ts:149-165 | ✅ soft archive only |
| A-018 | Unarchive via UI | Restore button reachable | store-access.ts:6,11 | ❌ archived store 404s; restore is dead code |
| A-019 | Discovery page, other tenant's store | 404 | discovery/page.tsx:7-15 | ❌ no tenant scoping |
| A-020 | acceptCandidate from another store | Rejected | discovery/actions.ts:31-34 | ❌ no ownership check |
| A-022 | Yandex discovery returns real data | Real API | connectors/yandex.ts:22-55 | ❌ hardcoded mocks, acceptable into DB |
| A-023 | Google sync FAILED | Marked FAILED, error shown | [id]/actions.ts:127-146 | ❌ shown as success |
| A-025 | Poster QR encodes canonical URL | Fixed prod base URL | poster/[slug]/page.tsx:43-47 | ⚠️ host-header derived |
| A-026 | Ingest same review twice | Deduped, no 2nd Telegram | reviews.ts:237-305 | ✅ |
| A-028 | Reviews ingest with no API key env | Fail closed | ingest/route.ts:21-23 | ❌ fail-OPEN |
| A-031 | DISABLE_AUTH_FOR_TESTING=true in prod | Refused | lib/auth.ts:36-42 | ❌ full bypass works |
| A-032 | repair-a5-links POST with empty body | Non-destructive | repair-a5-links/route.ts:15,39-42 | ❌ deletes ALL feedback by default |

## Security (S) — see CODE_AUDIT.md / LOGIC_AUDIT.md for detail

| ID | Scenario | Expected | Path | Status |
|----|----------|----------|------|--------|
| S-001 | REPORTS_API_KEY not discoverable | Secret | CHANGELOG.md:113, PROGRESS.md:235, TROUBLESHOOTING.md:41 + 5 more docs | ❌ literal value committed |
| S-002 | Admin password strong + not committed | Secret | DECISIONS.md:71-73 etc. | ❌ `TEAM_PASSWORD=12345` committed |
| S-003 | qr-check/create-missing-stores keys in env | Secret | api/admin/qr-check/route.ts:7 | ❌ hardcoded `<ADMIN_DIAG_KEY>` in source |
| S-004 | NODE_ENV≠production | Auth still required | lib/auth.ts:36-46 | ❌ auto-provisions OWNER bypass |
| S-005 | .env not shipped to Railway build | Excluded | app/Dockerfile:13 + .railwayignore | ❌ no .dockerignore; `.env*` uploaded into build context |
| S-006 | Telegram webhook secret required | Fail closed | api/telegram/webhook/route.ts:28-35 | ❌ fail-open if env unset |
| S-007 | Session cookies, password hashing | httpOnly/secure/scrypt | lib/auth.ts, lib/password.ts | ✅ |
| S-008 | Admin server actions re-verify auth | requireCurrentUser inside actions | admin/**/actions.ts | ✅ (except discovery page read) |
