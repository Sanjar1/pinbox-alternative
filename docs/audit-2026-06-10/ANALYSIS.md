# ANALYSIS — Pinbox Alternative (Audit 2026-06-10)

Audit performed by 5 parallel read-only agents (Fable). No code was modified.

## System map

- **Stack:** Next.js 16 App Router + React 19 + Prisma 5 + Postgres, deployed on Railway (`app/` subdirectory). Tailwind 4. Vitest (3 test files).
- **Public surface:** `/{slug}` — customer voting page (3 star questions, uz/ru), `/poster/{slug}`, `/api/health`.
- **Protected surface:** `/admin/*` pages (session cookie), `/api/reports/{daily,weekly,monthly}`, `/api/analytics/*`, `/api/admin/*` (Bearer `REPORTS_API_KEY` or hardcoded key), `/api/reviews/ingest`, `/api/telegram/webhook`.
- **Frozen invariant:** `QRCode.slug` for 41 printed posters must never change. Guarded by Prisma extension in `app/src/lib/db.ts:19-43`.

## Roles

| Role | Capabilities |
|---|---|
| Customer (anonymous) | Scan QR → vote 3 questions → optional comment. Rate-limited per device/IP/store. |
| Team admin (shared login, `TEAM_PASSWORD`) | Full admin: stores CRUD, import, discovery, posters, dashboard. Single shared user `team@kaas.local`, role OWNER. |
| Automation (GitHub Actions) | POST daily/weekly/monthly report + manager sync with Bearer key at 03:00 UTC. |
| Telegram bot | Receives alerts/reports; webhook drives review-state callbacks. |

## Key flows

1. **Voting:** GET `/{slug}` → scans+1 (awaited, every request incl. bots) → client collects 3 ratings → server action `submitFeedback` (`app/src/app/[slug]/actions.ts`) → validation → rate limits → `feedback.create` → if rating ≤3, in-memory 30s alert debounce → Telegram alert. Comment is a SECOND feedback row (`deviceId + '-comment'`) merged into the pending alert.
2. **Daily report:** GitHub Actions → `POST /api/admin/sync-managers` (Google Sheet → TM mapping) → `POST /api/reports/daily` → `report-builder.ts` computes previous Tashkent day → `report-format.ts` groups by TM → Telegram (split at 3900 chars).
3. **Store management:** create (form / CSV import / one-off API routes) → new QRCode row with generated slug; soft archive only (no hard delete); discovery via connectors (Yandex/2GIS are **mocks**, Google partially real).

## Data model (relevant)

`Tenant → Store → QRCode (slug @unique, scans), Feedback (comment encodes "[ratings] service:X;quality:Y;prices:Z"), MapReview (@@unique source+externalReviewId), PlatformLocationLink, AuditLog, User/Session`.

## Build health (verified by running)

- `npx tsc --noEmit` — **PASS** (0 errors)
- `npm run lint` — **PASS** (0 errors, 3 unused-var warnings)
- `npm test` — **FAIL**: `_render_preview.test.ts` is a live-production script disguised as a test (needs `GSA`/`DBURL` env) → suite always red. 13/14 real tests pass.

## Headline conclusion

The frozen-slug rule holds in all live code paths (verified: only `create` writes exist). The biggest risks are **leaked credentials in committed docs**, a **destructive-by-default repair endpoint**, **fail-open auth on several endpoints**, a **weekly report date-range bug**, and **silent loss of low-score alerts/comments**. Full details in LOGIC_AUDIT.md, CODE_AUDIT.md; prioritized plan in RECOMMENDATIONS.md.
