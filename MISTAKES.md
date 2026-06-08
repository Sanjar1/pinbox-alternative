# Mistakes and Lessons Learned

## 2026-06-08 — A GitHub "off-peak" deploy cron drifted INTO Railway's peak block, silently blocking deploys for days

- **What happened:** The TM-grouped report code was merged to `main`, but the new report never appeared and `/api/admin/sync-managers` returned 404 — production was still running OLD pre-merge code. The nightly deploy of our merge had FAILED on Jun 7 and Jun 8.
- **Root cause:** The nightly deploy cron was `0 2 * * *` (02:00 UTC, chosen specifically to be off-peak). But GitHub Actions scheduled workflows are best-effort and were firing **~4.5 hours late (~06:40 UTC)**, which is inside Railway's free-tier peak-hours block (08:00–20:00 Amsterdam = 06:00–18:00 UTC in summer). The `railway up` step was rejected instantly (~2s failure). The one recent success happened to fire at 05:58 UTC (2 min before peak) and built the older commit. So every attempt to ship the new code bounced.
- **How found:** Probed prod (`sync-managers` → 404 = old code; `origin/main` = our merge = correct). Then the GitHub Actions API (`…/actions/workflows/nightly-railway-deploy.yml/runs`) showed runs with the correct `head_sha` but `conclusion: failure`, and the job's "Deploy to Railway" step failing in ~2s — the signature of a Railway peak rejection (same message Railway gave when an env-var change tried to redeploy during peak).
- **Lesson:** This is the SECOND time GitHub cron lateness pushed an "off-peak" job into a provider blackout (first seen 2026-06-01 for the reports). A scheduled cron's nominal time is NOT its run time — drift of several hours is normal. Any cron that must run inside a window must be scheduled **early in that window with hours of slack to the nearest boundary**, never near the edge. Fixed by moving the deploy to 20:00 + 23:00 UTC (D-046). When a deploy "succeeds" but behaves like old code, verify WHICH commit/route set is actually live (a build-time artifact like the route list, or a known-new endpoint) before assuming the deploy shipped your branch.

## 2026-05-31 — Production was running UNCOMMITTED code; switching deploy method silently reverted live features

- **What happened:** After moving deploys from local `railway up` to the cloud GitHub Actions runner, the daily Telegram report reverted to an old compact "Отчет за сегодня" format (covering today) instead of the detailed previous-day report. Investigation showed the detailed report — and several other live features — existed only as **uncommitted changes in the working tree**.
- **Root cause:** `railway up` uploads the **working directory**, including uncommitted/untracked files. So work that was never `git add`-ed was silently live in production for weeks. The cloud runner builds **committed code only** (a fresh `git checkout`), so switching to it dropped every uncommitted improvement at once. A separate, compounding bug: `app/src/lib/feedback-filters.ts` was imported by committed code but itself never committed, so every cloud `next build` failed "Module not found" — the true reason 6 days of deploys failed (on top of the local memory crash).
- **How found:** User reported the changed daily-report format. `git status` showed `report-builder.ts` (and ~6 more source files) as modified-but-uncommitted; `git show HEAD:` vs working tree confirmed the deployed daily report was the old compact one while the detailed format lived only in the working tree.
- **Lesson:** Never let production depend on uncommitted working-tree state — it's invisible drift that vanishes the moment the deploy method changes. Commit everything that should run in prod (committed == deployed, D-044). When taking over a project that deploys via a working-tree uploader (`railway up`, `vercel` without git, rsync), audit `git status` FIRST and commit live-but-uncommitted files before changing anything. Also: a file imported by committed code but not itself committed breaks CI builds even when it works locally — `git add` new modules immediately.

## 2026-05-31 — Railway "Root Directory" must match where `railway up` is run from

- **What happened:** Cloud `railway up` from `app/` failed: "lstat .../snapshot-target-unpack/app: no such file or directory", and earlier "couldn't locate a dockerfile at path app/Dockerfile in code archive".
- **Root cause:** The Railway service Root Directory = `app`, so Railway cd's into an `app/` subdir of the uploaded snapshot. Uploading from `app/` gives a snapshot whose root already IS `app/` (no nested `app/`). The local Windows task worked from `app/` only because the CLI's global link points at the repo-root path; the token-only cloud runner has no link, so it must upload from the repo root.
- **Lesson:** With Railway Root Directory set to a subfolder, uploads must be rooted at the repo so that subfolder exists in the snapshot. Match the upload CWD to the service's Root Directory config (D-043).

## 2026-05-29 — Nightly deploy silently died for 6 days; no failure detection meant nobody noticed

- **What happened:** The 05-24 work (new Telegram template, simplified login, vote-count fix, dashboard trends) was committed and pushed but never reached production. For ~6 days the live site ran 05-23 code and the bot kept sending the OLD raw "New feedback received" messages. The 23:05 nightly `railway up` had been crashing at "Indexing…" (Rust out-of-memory) every night since 05-24 — it never got to "Uploading…".
- **Root cause (two compounding):** (1) `railway up` crashes during local "Indexing" under machine memory pressure — the allocation shrank as the indexed tree shrank but still failed at ~126 MB, so it's local resource pressure, not project size. (2) The old `railway-night-deploy.ps1` had **no success check, no retry, and no alert** — it piped output to a log and exited, so a crash looked identical to a success from the outside. The task was also `DisallowStartIfOnBatteries=true` with no `WakeToRun`, so it silently skipped nights on battery/sleep (no log at all on 05-19/20/25).
- **How found:** User noticed the bot sent old-format messages on 05-29 and asked if it was a deploy problem. The string "New feedback received" no longer exists in source (deleted in `ddd384b`), so a live app emitting it MUST be running pre-`ddd384b` code — conclusive. Railway dashboard confirmed the active deployment was "railway up · 6 days ago via CLI".
- **Lesson:** An automated deploy with no success assertion and no failure alert is worse than no automation — it creates false confidence. Every unattended deploy MUST (a) verify it actually uploaded/built (not just "command exited"), (b) alert a human on failure, and (c) not depend on a single laptop being awake. Fixed: cloud GitHub Actions deploy as primary (D-042) + hardened local script that retries and Telegram-alerts on failure.
- **Bonus gotchas:** `railway variables --set` / dashboard Deploy / any deploy is blocked on free tier 08:00–20:00 Amsterdam (`europe-west4`); time deploys after 20:00 Amsterdam. `schtasks.exe` works when the `Get-/Register-ScheduledTask` CIM cmdlets hang, but git-bash needs `MSYS_NO_PATHCONV=1` so it doesn't mangle `/query`-style flags into file paths. `schtasks /create /xml` requires the XML to be UTF-16.

## 2026-05-24 — `railway variables --set` write succeeds even when the auto-redeploy is blocked by peak hours

- **What happened:** Ran `railway variables --set TEAM_PASSWORD=12345 --service web`. Command returned an error referencing "Free-tier deploys not available during peak hours." Looked like the entire operation failed. In reality only the auto-redeploy was blocked; the variable write had already succeeded before the redeploy step was attempted.
- **Root cause:** `railway variables --set` is a two-step operation internally: (1) write the variable value to Railway's config store, (2) trigger a redeploy to pick up the new value. The free-tier peak-hours block (`europe-west4-drams3a`, 08:00–20:00 Amsterdam) only blocks step 2. Step 1 always succeeds. The CLI surfaces the step-2 error as if the whole command failed.
- **Verification method:** `railway variables --service web --kv | grep TEAM_PASSWORD` immediately after — if the variable appears (even masked as `*******`), the write succeeded. The redeploy will happen at 23:05 Tashkent via the existing nightly task.
- **Lesson:** When `railway variables --set` fails with a peak-hours error, always verify the write independently before assuming failure and retrying. Retrying will write the value again (idempotent), but wasted time. The variable is live in the store; only the service restart (to pick up the new env var) is pending.

## 2026-05-24 — Two-writer pattern masked by dedup at a different layer

- **What happened:** The voting client writes two Feedback rows per customer visit (vote + free-text comment), both with different `deviceHash` values. The Telegram alert system deduped these two rows via `sessionKey` in `feedback-alert-buffer.ts`, so alerts were correct. However, the dashboard and daily/weekly/monthly reports both counted both rows, inflating vote counts silently for ~6 weeks before the bug was discovered.
- **Root cause:** The two-rows-per-visit pattern was introduced in the write path (`client.tsx:136` + `actions.ts:85`). The Telegram alert dedup at the notification layer masked the symptom (alerts looked correct), making the bug invisible to the people who monitor Telegram messages. The dashboard/report aggregations silently inflated because no one monitors every dashboard number every day, and the over-count was small enough (2–3% per store) to avoid obvious alarm.
- **Lesson:** When two code paths write to the same table for "one logical event," at least one read aggregation will eventually be wrong. Prefer: (1) write-time dedup (canonical row only), or (2) add a `kind` column to distinguish the rows, then filter at read time. Dedup at one notification layer while counts at a different layer are both reading the same table — they will diverge. The dedup that works for alerts won't work for analytics. In this case, the symptom was masked for weeks because one consumer (Telegram) was deduped while others (dashboard, reports) were not.
- **How found:** User reported seeing 2 votes at 11:58/11:59 Tashkent but it was one customer. Spot-check of the DB revealed the pattern: every low-score session produced two rows with slightly different timestamps and different `deviceHash` values (the second appended `-comment` to the original `deviceId`).

## 2026-05-24 — GitHub PAT without `workflow` scope blocks workflow file pushes

- **What happened:** Attempted to push `.github/workflows/weekly-telegram-report.yml` and `.github/workflows/monthly-telegram-report.yml` via CLI (Git over HTTPS). GitHub rejected: `refusing to allow a Personal Access Token to create or update workflow ... without 'workflow' scope`.
- **Root cause:** PAT `telegram-ai-agent deploy` was created with `repo` scope only, not `workflow`. This entry also appeared in a 2026-05-21 session — the lesson was not acted on.
- **Workaround used:** Created both files via GitHub web UI (uses browser session cookies, bypasses PAT scope restriction).
- **Lesson:** Add `workflow` scope to the PAT immediately after the next email sudo-mode verification at github.com/settings/tokens. The same workaround has been needed twice — third time is not acceptable.

## 2026-05-24 — CodeMirror 6 auto-indent compounds indentation when typing line by line

- **What happened:** Typing multi-line YAML into the GitHub web editor (CodeMirror 6) via `computer.type`/keystroke-by-keystroke caused per-line auto-indent to compound. Each new line got one extra indent beyond the previous, producing syntactically invalid YAML that appeared correct at a glance.
- **Root cause:** CodeMirror 6 default keymap calls `indentMore` on Enter, preserving current indent plus adding whatever the user typed. Compounding is invisible until parsed.
- **Workaround used:** `cmEl.focus(); document.execCommand('insertText', false, content)` after select-all+delete. `insertText` behaves like a paste and bypasses per-character autoindent.
- **Lesson:** Always use `execCommand('insertText')` or a synthesized paste event when injecting multi-line content into CodeMirror/Monaco editors. Never type line-by-line into these editors programmatically.

## 2026-05-24 — Railway free-tier deploy blackout window must be respected; existing nightly task already handles it

- **What happened:** `railway up` and `railway redeploy` refused with a peak-hours restriction referencing `europe-west4-drams3a` during daytime Amsterdam hours.
- **Root cause:** Railway free-tier blocks deployments 08:00–20:00 Amsterdam time. This was already documented in TROUBLESHOOTING.md and the existing `Pinbox-Railway-Night-Deploy` Windows Scheduled Task (23:05 Tashkent = 20:05 CEST) already threads the needle.
- **Lesson:** Before attempting a manual Railway deploy, check the clock (Amsterdam time). If 08:00–20:00 CEST, don't try — queue a commit for the nightly task instead. The nightly task timing was chosen deliberately for this reason; don't change it.

## 2026-05-21 (end of session) — Scheduled Railway deploy task ran from repo root, silently failing every night

- **What happened:** `Pinbox-Railway-Night-Deploy` Windows Scheduled Task had been firing nightly but with exit code `2147946720` (= `0x80070960`, a generic failure). Investigation showed `scripts/railway-night-deploy.ps1` was doing `Push-Location $ProjectRoot` (the repo root) before calling `railway up`, so the CLI ran from the wrong directory. The deploy appeared to run but silently did nothing because no `railway.json` exists at repo root.
- **Root cause:** When the nightly task was originally created, the lesson "Railway CLI deploy must run from `app/` subdir" was already recorded in this file (entry from 2026-05-18). However, that lesson was never propagated back to the script itself. The script continued using the wrong path while the lesson sat unused in this document.
- **Lesson:** When recording a "must do X" lesson in MISTAKES.md, immediately audit every existing automation that touches the same thing. A lesson that does not update the relevant script, task, or runbook is half a lesson. Treat MISTAKES.md entries that describe CLI path/config requirements as triggers for a code search (`grep -r "railway up"`) to find all callers.

## 2026-05-21 (afternoon) — GitHub PAT lacked `workflow` scope, blocked workflow file pushes

- **What happened:** Created `.github/workflows/daily-telegram-report.yml` locally, committed it, ran `git push`. GitHub rejected with `refusing to allow a Personal Access Token to create or update workflow ... without 'workflow' scope`.
- **Root cause:** PATs created without ticking the `workflow` checkbox cannot write to `.github/workflows/`. The active PAT (`telegram-ai-agent deploy`) had `repo` but not `workflow`.
- **Workaround used:** Created the file via the GitHub web UI (`Add file → Create new file`). The web UI uses browser session cookies, not the PAT, so it bypasses the scope restriction. Then synced the local repo to `origin/main` with `git reset origin/main`.
- **Lesson:** When creating a GitHub PAT for any repo that will house GitHub Actions workflows, include `workflow` scope from the start. Alternative paths if the PAT scope can't be updated: use the web UI (browser cookies), use `gh` CLI (OAuth), or generate a separate PAT with `workflow`.

## 2026-05-21 (afternoon) — GitHub web editor auto-indent compounded indentation per newline

- **What happened:** Pasting YAML into the GitHub web "Create new file" CodeMirror editor by typing keystrokes caused indentation to grow by 2 spaces on every newline (`schedule:` ended up at 2 spaces, the cron line at 6, the next line at 10, etc.). The resulting YAML was syntactically invalid even though the visible scroll position made it look fine.
- **Root cause:** CodeMirror 6's default keymap calls `indentMore` on Enter to preserve the current indent, then adds whatever spaces the typed text had on top. Each newline compounded.
- **Workaround used:** After select-all + delete, called `document.execCommand('insertText', false, yamlContent)` from the JavaScript console. `insertText` inserts the buffer atomically (like a paste), bypassing the per-character autoindent path.
- **Lesson:** When injecting multi-line content into a CodeMirror/Monaco editor via automation, use `execCommand('insertText')` or a synthesized paste event. Never type line-by-line — autoindent will corrupt the structure silently.

## 2026-05-21 - Railway scheduled Function was assumed available before provisioning check

- **What happened:** Tried to create `daily-report-cron` as a Railway scheduled Function for the 08:00 Telegram report.
- **Root cause:** The current Railway plan/resource state cannot provision another scheduled Function and returned `Free plan resource provision limit exceeded`.
- **Lesson:** Before choosing Railway Functions for cron, check current project resource limits. If blocked, use an external scheduler or upgrade/provision resources before marking automation complete.
## 2026-05-18 - Railway CLI deploy timed out due to un-ignored large files

- **What happened:** `railway up` from `app/` kept timing out during upload even though the source code is small.
- **Root cause:** `app/test-output/` (47MB of poster PNG images) was not in `.gitignore`, so Railway CLI included every file in the upload snapshot.
- **Lesson:** Before any CLI deploy, check `app/.gitignore` for generated output directories. Railway respects `.gitignore`; anything not ignored gets uploaded. 47MB > timeout.

## 2026-05-18 - Assumed GitHub auto-deploy would pick up push immediately

- **What happened:** Pushed to `main`, waited, saw an existing deployment go to SUCCESS � assumed it was from my push. It was a pre-existing deployment of old code. The new routes were absent in production.
- **Root cause:** Didn't verify that the build log contained the expected new routes before calling the repair endpoint.
- **Lesson:** After every deploy, check `railway logs <ID> --build | grep api/admin` to confirm new routes appear in the build route table before executing DB operations.

## 2026-05-17 - Printing batch validated before full URL health was green

- **What happened:** The A5 batch looked ready visually, but many posters still had `VOTING_URL_PLACEHOLDER`.
- **Root cause:** Final print health gate on URL status was not enforced before approval flow continued.
- **Lesson:** Treat `HTTP 200 for all poster QR links` as a mandatory pre-print gate, not a post-check.

## 2026-03-15 - Mapping link coverage by row order instead of store identity

- **What happened:** Early coverage output mismatched some stores and links because rows from two files were paired by position.
- **Root cause:** Store datasets were generated at different times/order and include encoding artifacts, so row order was not a stable key.
- **Lesson:** Always join operational datasets by a stable identity (`store name + normalized decoding` or ID), never by row index.

## 2026-03-08 - Tried live QR testing before local schema was fully migrated

- **What happened:** The QR feedback flow was prepared for testing, but feedback queries hit a missing-column error because the local SQLite DB had not applied the newest feedback-protection migration.
- **Root cause:** Code and Prisma schema had moved ahead of the local database state.
- **Lesson:** Before any end-to-end test, explicitly verify local DB migrations against the active Prisma schema.
