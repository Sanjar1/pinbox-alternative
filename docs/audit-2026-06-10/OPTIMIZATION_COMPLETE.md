# OPTIMIZATION_COMPLETE — Bundles A, B, C (2026-06-10)

Branch: `optimization/fixes` (4 commits, not merged, not deployed).
Approved scope: A (security), B (reports), C (voting reliability). D+E not approved — not touched.

## Implemented

| Item | Commit | Verification |
|---|---|---|
| B1/B3 weekly range + label | aba35d1 | temp vitest @ simulated clocks: end=Mon 00:00 Tashkent; label "25-31 май 2026" (was "25-0"); Dec→Jan months correct; daily range regression-checked |
| B2 manager-sync wipe guard | aba35d1 | aborts when matches < 50% of active stores |
| B4 unassigned silent stores | aba35d1 | report-format.test.ts updated, 13/13 pass |
| B5 no duplicate report send | aba35d1 | workflow: dropped --retry-all-errors, --max-time 180 |
| A2 repair-a5-links default | 67f7741 | clearFeedback defaults false; empty body never deletes |
| A3 env-based diag key | 67f7741 | ADMIN_DIAG_KEY, fail closed |
| A4 login rate limit + timing-safe compare | 67f7741 | 5 fails/15min per IP |
| A5 .dockerignore/.railwayignore; .env.tmp deleted | 67f7741 | `.env*` excluded from build context |
| A6 fail closed (ingest, webhook, allow-list, auth bypass) | 67f7741 | see env caveats below |
| A7 repair-script prod gate | 67f7741 | refuses non-local DATABASE_URL without --i-understand-production |
| A1/A4 doc scrub | 8d9b76a | no secret literals remain in tracked files (history still has them) |
| C1 client error handling | 8b6d8a8 | try/catch/finally, result checked, maxLength=1000 |
| C2 res.ok + allSettled logging | 8b6d8a8 | Telegram/Resend failures now logged |
| C3 alert on min rating ≤2 | 8b6d8a8 | temp vitest: [1,5,5] now alerts; spoofed breakdown values rejected |
| C5 SIGTERM flush + 30min TTL | 8b6d8a8 | pending alerts flushed on shutdown |
| C4/C7 device-id hardening | 8b6d8a8 | format validated; comment phase reuses vote id from state |
| C6 scan counter | 8b6d8a8 | after() post-response, bot/health-check UAs skipped |
| Localized errors (issue #29 partial) | 8b6d8a8 | customer-facing messages now Russian |

## Verification evidence

- `npx tsc --noEmit` — PASS (0 errors)
- `npm run lint` — PASS (0 errors, 3 pre-existing warnings)
- `npx vitest run report-format manager-match` — 13/13 PASS
- Temp verification suite (6 tests, simulated clocks) — 6/6 PASS, then removed
- `npm run build` — PASS, all routes compiled
- Live browser walk-through NOT performed: no local Postgres/Docker on this machine and the only configured DB besides localhost is production. Stated explicitly per the operating agreement.

## Required operational steps (user / next session)

1. **Rotate `REPORTS_API_KEY`** in Railway AND the GitHub Actions secret — old value is still in git history.
2. **Change `TEAM_PASSWORD`** in Railway (currently the known-leaked trivial value).
3. **Set env vars in Railway or these features stay disabled (fail closed now):**
   - `ADMIN_DIAG_KEY` — only if /api/admin/qr-check and create-missing-stores are still wanted
   - `REVIEWS_INGEST_API_KEY` — reviews ingestion rejects all requests if unset
   - `TELEGRAM_WEBHOOK_SECRET` — telegram webhook rejects all requests if unset
   - `TELEGRAM_ALLOWED_USER_IDS` — review buttons deny everyone if unset
4. **Deploy** from `app/` after merge (needs explicit "deploy to prod").
5. Follow-ups not in approved scope: D (admin flows: import duplication, archive recovery, discovery scoping, mock connectors), E (test suite fix, junk cleanup, dedup), DB-level slug trigger, report idempotency key.
