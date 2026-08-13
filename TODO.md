# TODO

**Updated:** 2026-08-13 — PRODUCTION IS DOWN (see OWNER ACTIONS)

---

## 🔴 OWNER ACTIONS — open until you say they're done

### ✅ OWNER-1 (2026-08-13) — RESOLVED: Pinbox is back online. Hobby $5 paid.

**Outage:** 2026-08-12 09:31 UTC → 2026-08-13 06:21 UTC (~21 h). All 41 printed QR posters served
Railway's "train has not arrived at the station" page. Votes scanned in that window were never
saved — lost, not queued. The 2026-08-13 08:00 Telegram report also did not arrive.

**Cause:** not our code. The last deploy (2026-08-11 23:45 UTC) built cleanly and passed its health
check. Railway's 30-day trial expired and Railway paused every deployment. Verbatim from the
`Plans` page: `Your trial is over` / `30 day trial expired` / `All deployments are paused`, and
deploys were rejected with `Your trial has expired. Please select a plan to continue using Railway.`

**Fix applied (owner-approved):** subscribed to **Hobby $5/month**, charged $5 upfront to the saved
Visa ending 5407. Verified `customer.state: ACTIVE`, `isUsageSubscriber: true`,
subscription `sub_1U3rzECJoPsRzQsdkjfqfuC0` status `active`.

**Restoration verified live:**
- `/api/health` → `{"ok":true,"db":true}`
- root page → HTTP 200 in 0.36 s
- `scripts/check-a5-qr.cjs` → `{"total":41,"summary":{"200":41}}` — **41/41 posters green**
- log trace → `migrations up to date` → `Ready in 136ms` → `[health] START db-select-1` /
  `END db-select-1 ok`

**Correction kept on record:** it was first written here that there is "no zero-cost path back".
That was wrong. Railway's pricing page still lists a **Free plan, $0/month with $1 of usage credit
per month** — enough for this app (August usage was $0.69, one project, two services). The owner's
objection was correct on the facts. What is true is narrower: **the account is not being OFFERED
that plan** — the workspace `Plans` page shows only Hobby and Pro, and the API reports
`hasExhaustedFreePlan: true`. Resolving that is now OWNER-2 below, not a blocker.

---

### ✅ OWNER-2 (2026-08-13) — SENT: asked Railway to move the workspace to the Free plan

**Status: SENT 2026-08-13.** Thread is live and awaiting a Railway reply:
https://station.railway.com/support/trial-expired-with-no-free-plan-offered-043303db

Verified after posting: the page shows all 9 paragraphs, author `sanjar1` / HOBBY / OP, and the
key facts survived intact (`21 hours`, `hasExhaustedFreePlan`, `$4.31`, `41 physical posters`).

**On privacy — the final answer.** The submit button says *"Create Private Thread"*, but Railway
shows a confirmation gate first: *"If a question can be answered by the community instead, we may
open the thread as a public bounty"*, with a required checkbox **"I understand this thread may be
made public."** So it starts private but Railway can publish it. The owner had already approved
posting publicly, so this is within what he authorised. The message contains no credentials, no
tokens, no project IDs and not the poster domain — only the plan situation, usage figures and the
41-poster constraint.

Railway's docs still say Trial/Free/Hobby get community support with **no guaranteed response**,
so treat a reply as a maybe, not a plan.

**What was sent (title, then body):**


> Trial expired with no Free plan offered - how do I move my workspace to the Free plan?

> My workspace's 30-day trial expired and all deployments were paused, which took my production app
> offline for about 21 hours. To restore service I have just subscribed to Hobby ($5). My question
> is about getting onto the Free plan instead.
>
> The problem: my Plans page only ever offered Hobby ($5) and Pro ($20). There was no option to
> select the Free plan anywhere in the workspace UI, and deploys were rejected with "Your trial has
> expired. Please select a plan to continue using Railway."
>
> However, your pricing page lists a Free plan at $0/month with $1 of usage credit per month, and
> that is comfortably enough for this app. My August usage was $0.69. I now have only one project
> with two services: a small Next.js app and a Postgres database, well within 0.5 GB RAM.
>
> Questions:
> 1. How do I move this workspace onto the Free plan? Is it selectable anywhere, or does it require
>    support to enable it?
> 2. Is the Free plan unavailable to accounts that previously subscribed to Hobby and then
>    cancelled? My workspace reports hasExhaustedFreePlan: true, so I would like to know whether
>    that permanently rules out the Free tier.
> 3. I had roughly $4.31 of unused trial credit when the trial expired by date rather than by being
>    spent. Is that credit recoverable or applied to the new subscription?
>
> Context on why this matters: this app is a customer-feedback QR system for a retail chain. Its URL
> is printed on 41 physical posters in stores, so I cannot move it to another host without
> reprinting all of them. I need to know whether I can rely on the Free plan long term or should
> stay on Hobby.
>
> Thank you.

**⚠️ Do NOT cancel Hobby again until Railway confirms a Free plan is actually available to this
account.** Cancelling is exactly what caused this outage: the plan lapsed, there was no free tier
to land on, and 41 posters went dark for a day.

---

---

---

### OWNER-4 (2026-08-13) — Answered: "my votes don't work". Votes DO work; what did you see?

Investigated live on 13 Aug ~07:40 UTC. **Voting is working.** Evidence:
- Submitted a real vote through the poster page in a browser → success screen
  "✓ Раҳмат! Хабарингиз қабул қилинди."
- That vote is in the production DB: `2026-08-13T07:40:35` rating=5 status=NEW.
  (Store: **RUBA БУХАРА**, 5/5/5 — my test row, discount it when reading that store's numbers.)
- **13 votes today from real customers**, all `status=NEW`, so the public is voting fine.
- Full star→submit flow re-verified in a clean browser: all three questions rate, submit enables.

**False alarm I nearly reported:** on a second pass the stars stopped responding. That was my own
Chrome tab wedged (screenshots were timing out too), not the app — an independent browser worked
perfectly. Do not treat this as an app bug.

**Most likely what the owner hit — by design, not a fault.** `app/src/app/[slug]/actions.ts`
enforces **one vote per device per store per 35 days**:
`if (deviceVotesInCooldown >= 1) return { error: 'С этого устройства можно голосовать один раз в 35 дней.' }`
If he tested a store before, his phone is refused on that store until 35 days pass. Other limits:
≥5 votes from one IP in 10 min, ≥25/day per store. Also App Sleeping makes the first load after
idle take 3–10 s, which can feel like a dead page.

**Open question for the owner:** what exactly appeared — a red message (which one?), a spinning
button, or nothing at all? That distinguishes "anti-abuse working" from a real bug.

**Also worth watching (not yet explained):** daily vote counts 10 Aug **134** → 11 Aug **62** →
12 Aug **49** (outage from 14:31 local) → 13 Aug **13** so far. The 10→11 fall happened BEFORE the
outage, so the outage does not explain it. Could be day-of-week. Not investigated yet.

### OWNER-3 (2026-08-13) — Decide: the 12 August daily Telegram report was never delivered

The 08:00 report run failed twice on 13 Aug (03:33 and 04:22 UTC) because the app was down. The
app is up now and the workflow can be re-run by hand.

**The catch, so the number does not mislead you:** that report covers the whole of 12 August
Tashkent time, but the outage began 14:31 Tashkent that day. A re-run would produce a report that
is technically correct yet silently missing the back half of the day — it would read like a
collapse in customer feedback when it is really an outage artefact.

**Your call:**
- **(a)** Re-run it and read it as "morning of 12 Aug only" — I will label it that way, or
- **(b)** Skip 12 Aug entirely and let 13 Aug be the next report.

Either way no votes can be recovered: they were never queued, they were lost at the door.

## Priority 0 — Restore production — ✅ DONE 2026-08-13
- [x] **DONE 2026-08-13 — production restored and verified.** Railway rebuilt after the Hobby
      subscription; all three restore checks pass:
      - `/api/health` → `{"ok":true,"db":true}`; root URL `http=200` in 0.363 s.
      - all 41 poster URLs → `scripts/check-a5-qr.cjs` reported `{"total": 41, "summary": {"200": 41}}`.
      - log trace clean: `No pending migrations to apply` → `[entrypoint] migrations up to date -
        starting server` → `✓ Ready in 136ms` → `[health] START db-select-1` → `[health] END
        db-select-1 ok`.
- [x] **Vote path to the TM bot — verified live 2026-08-13, both directions:**
      - unauthenticated `POST /qr-vote` → `401 {"error":"unauthorized"}` in 0.55 s — it refuses
        LOUDLY rather than degrading silently.
      - authenticated push using the exact URL + secret pair currently in the `web` service's
        production env → `200 {"ok":true}` in 0.646 s, well inside the hook's 2.5 s timeout.
        Sent with `tester: true`, which by contract the bot ignores, so no real data was polluted.
      - **Scope of the proof, stated honestly:** this confirms the credentials and the endpoint
        the production app holds right now are accepted by the live bot. It does not exercise the
        app-side trigger (a customer tapping a poster), which is unchanged code covered by
        `tm-vote-hook.test.ts`. A genuine end-to-end vote would write real feedback into
        production, so it is left for the owner to do by scanning any poster.
- [x] Pre-checked for the restore: `TM_BOT_VOTE_HOOK_URL` is still correct
      (`https://bots.159.69.107.254.nip.io/qr-vote`) — verified 2026-08-13, so the redeploy will
      not silently drop votes (see `MIGRATION.md`).
- [ ] **After restore:** add an uptime check that alerts when the poster domain stops answering.
      This outage ran ~19 h undetected (of a ~21 h total) and was found only because the owner scanned a poster.
      The 2026-07-05 outage had the same shape — twice is a pattern, not bad luck.
- [x] **DONE 2026-08-13:** rewrote the `CLAUDE.md` hard rule (now "Railway plan & usage budget").
      Its old strategy ("optimize under $1.00/mo and downgrade back to Free") is what led here.
      The rewrite puts "never leave this workspace without a paid plan" ABOVE the cost budget,
      records both outages, and forbids asserting what Railway's plan catalog offers without
      checking `/workspace/plans` live first. Backup of the old file kept in the session scratchpad.
- [ ] **After restore:** the `nightly-railway-deploy` and `daily-telegram-report` workflows both
      failed silently into GitHub's UI for a day. Wire the Telegram failure-alert step that is
      already listed further down this file.

### Done 2026-07-05 session 9b — was Priority 0 (both closed, canary-proven)
- [x] **Prod migration pipeline hardened** — migrations auto-apply at container start (entrypoint `migrate deploy`, retry+fail-safe); SQLite migrations squashed to PostgreSQL `0_init`; prod baselined after empty drift gate; dashboard start-command override cleared (was the silent bypass); CI slug-guard added. Canary column added+dropped via git+deploy only. NEVER `db push` prod again.
- [x] **`/api/health` does a real `SELECT 1`** — 5s timeout, 503 on DB failure, verified live (`{"ok":true,"db":true}`) + log trace START→END.
- [x] **Daily-report crons shifted** to `23 1` / `23 2` UTC (approved + shipped; verify arrival time tomorrow).
- [x] Dead `Postgres` service deleted from Railway (owner OK'd; verified empty first).
- [x] Tmp-script cleanup + 41-link checker promoted to `scripts/check-a5-qr.cjs` (cwd bug fixed, 41/41 verified).

- [ ] **NEW: review pre-2026-07-05 uncommitted working-tree files** (README/SPECS/GLOSSARY/DEVELOPMENT/app/Dockerfile edits, scratch scripts, deleted test-output) — commit or discard file-by-file. CAUTION: `app/Dockerfile` diff would change the production image if committed blindly.
- [ ] **NEW: verify tomorrow's report arrives ~08:00–09:00 Tashkent** (first run on the new 01:23/02:23 UTC crons).

## Priority 0 — Railway cost sustainability (new, from the 2026-07-05 outage)
- [ ] **Verify App Sleeping actually works (1–2 days after 2026-07-05):** check railway.com/workspace/usage daily burn — sleeping ≈ $0.02/day vs flat ≈ $0.04/day. If flat, find what keeps the app awake (suspect: outbound DB keepalives); fallbacks = scheduled night stop (owner suggested) or move DB to free Neon Postgres (web stays on Railway — domain frozen).
- [x] ~~**Early August, BEFORE the next $5 charge:** owner cancels Hobby → back to Free.~~
      🔴 **CANCELLED 2026-08-13 — THIS INSTRUCTION CAUSED THE OUTAGE.** Hobby was cancelled, the
      workspace fell to a 30-day trial, the trial expired *by date* on 12 Aug, Railway paused every
      deployment and all 41 posters went dark for ~21 hours. There was no Free tier to land on:
      `/workspace/plans` offers this account only Hobby ($5) and Pro ($20), and the API reports
      `hasExhaustedFreePlan: true`. **Do not cancel Hobby again** unless Railway states in writing
      that this workspace can move to Free (asked in OWNER-2). Usage is not the constraint — August
      was $0.69, comfortably under even the $1 Free grant. The plan itself was.
- [x] ~~DECIDE: upgrade Railway to paid vs stay free~~ — **decided 2026-07-05:** Hobby $5 paid for July only as a stopgap after the free-tier grant ran out and took prod down; long-term target was back to Free under the $1/mo grant — **that target was WRONG and caused the 2026-08-12 outage; superseded 2026-08-13, see CLAUDE.md "Railway plan & usage budget" hard rule.**
- [ ] (Needs owner OK) Delete the dead `Postgres` service on the Railway canvas (build failed 4 months ago, $0 usage, unused) — reduces confusion; zero cost impact.

## Priority 0 — Harden the prod migration pipeline — ✅ CLOSED 2026-07-05 (session 9b, see above)
- [x] **Make schema changes auto-apply on deploy** — done differently than sketched: squashed to ONE PostgreSQL `0_init` (the 11 sqlite files could never baseline safely as-is), baselined via `resolve --applied 0_init` after an empty drift gate, AND cleared the Railway start-command override that was the real bypass. Canary-proven. Manual `db push` is now FORBIDDEN (would recreate drift).
- [x] **Make `/api/health` do a `SELECT 1`** — live: `{"ok":true,"db":true}` / 503 on failure.
- [ ] **DECIDE: upgrade Railway to paid (~$5/mo Hobby) or stay free-tier?** Nightly deploy was failing on free-tier peak drift; the 20:00/23:00 UTC fix should resolve it, but upgrading removes the peak block entirely. Needs user's spend approval.
- [ ] (Optional) Assign Катортол + Чилонзор Торговый to a manager in the "Менеджеры" sheet so they appear in a TM block instead of only the totals.

### Done this session (2026-06-09) — was Priority 0
- [x] Prod outage fixed — `Store.territorialManager` column added to prod DB; 41/41 posters back to HTTP 200.
- [x] `POST /api/admin/sync-managers` → `{matched:41, ...}` verified live (was 0; fixed the stale sheet-gid → resolve by title).
- [x] Daily report confirmed in the managers group with the new grouped format + explicit 0-row stores per TM (msg 63841).
- [x] TM-grouped reporting deployed & verified live → **M5 reporting activation closed in ROADMAP.**

## Priority 1 — Quick wins
- [x] Fix the `-comment` deviceId double-counting bug (read-side filter approach, deployed pending 23:05 Tashkent auto-task).
- [x] Simplify login to single password field (code + env var done; ships at 23:05 Tashkent auto-task).
- [ ] Add `workflow` scope to PAT `telegram-ai-agent deploy` (requires github.com/settings/tokens → email sudo-mode). Blocks future workflow file edits from CLI.
- [x] Confirm the automatic daily report cron is still delivering — verified 2026-06-12: delivering every day (Jun 6–11 all green), dedup guard works. BUT GitHub drifts the 03:00/04:00 UTC crons by 3.5–5h → report lands ~12:00–13:30 Tashkent, not 08:00.
- [x] M5 — Reporting Activation closed (session 7, 2026-06-09).
- [ ] **DECIDE: shift daily-report crons to early off-peak odd minutes** (e.g. `23 1 * * *` + `23 2 * * *`) so the report lands nearer 08:00 Tashkent despite GitHub drift. Constraint: must fire after 19:00 UTC (Tashkent midnight) for the correct previous-day range (D-031). Offered to owner 2026-06-12, awaiting go-ahead.

## Priority 2 — Security hardening (MEDIUM — new from session 3)
- [ ] Add rate-limiting to `POST /login`. Trivial password (`<redacted>`) on a public-internet URL (`web-production-370c1.up.railway.app/admin`) is a bot brute-force risk. Options: server-action-level counter keyed by IP hash, or a Railway/edge rule. No code change needed if password is changed first, but rate-limiting is good hygiene regardless.
- [ ] When the team's trust model changes, update `TEAM_PASSWORD` in Railway dashboard to a stronger value (no code deploy needed — just restart the service).

## Priority 3 — Cleanup (carried from 2026-05-21)
- [ ] Remove temporary helper scripts: `scripts/tmp-check-a5-qr.cjs`, `scripts/audit-a5-poster-links.cjs`, `scripts/tmp-extract-qr-links.cjs`, `scripts/tmp-fix-a5-placeholders.cjs`.
- [ ] Delete the stray file named `console.log(JSON.stringify(row)))` in repo root (created by an accidental shell redirect).
- [ ] Smoke-test a random handful of QR links.
- [ ] Add `* text=auto eol=lf` to `.gitattributes` to silence CRLF/LF warnings.

## Priority 4 — Optional hardening
- [ ] Add Telegram failure-alert step to `.github/workflows/daily-telegram-report.yml` (posts to Telegram on workflow failure in addition to GitHub email).
- [ ] Add expiration date to `bi_readonly` Postgres role (e.g. `VALID UNTIL '2026-08-21'`) so analyst access auto-expires after 3 months unless renewed.

## Stretch / future
- [ ] Add a Russian-language flag to the analyst-onboarding doc once English-speaking analysts join.

---

## Recently closed (see `PROGRESS.md` for the full story)

- 2026-05-24 — Simplified team login (single password field, Russian UI, `team@kaas.local` singleton, `TEAM_PASSWORD` env var).
- 2026-05-24 — Weekly + monthly Telegram report GitHub Actions crons added.
- 2026-05-24 — Low-rating Telegram alert rewritten to Russian/shaming-tone template.
- 2026-05-24 — In-memory debounce buffer added (one alert per customer visit, not two).
- 2026-05-21 — GitHub Actions daily cron live (run #1 green).
- 2026-05-21 — QR slug freeze (D-033) deployed.
- 2026-05-21 — Power BI runbook + Russian analyst message published.
- 2026-05-21 — Admin dashboard Russian translation done locally.
- 2026-05-18 — 41/41 A5 poster QR links HTTP 200 in production.
- 2026-05-18 — Repair endpoint + brand theming + archivedAt + admin/analytics endpoints deployed.
