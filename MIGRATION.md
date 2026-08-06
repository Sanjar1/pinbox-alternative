# Migration status — Pinbox (QR voting app)

**Status: STAYS ON RAILWAY. Excluded from the Hetzner migration by the owner.**
Last reviewed 2026-08-06.

Nothing here moved and nothing here should move without a new decision. But **one thing about
this project changed on 2026-08-06 and you must know about it.**

## ⚠️ The bot this app pushes votes to has MOVED

`app/src/lib/tm-vote-hook.ts` pushes every customer vote to the Territorial Managers checklist
bot. That bot left Fly.io on 2026-08-06 and now runs on our own server.

| | |
|---|---|
| Railway variable | `TM_BOT_VOTE_HOOK_URL` on service `web` |
| Old value | `https://tm-checklist-bot.fly.dev/qr-vote` ← **dead** |
| Current value | `https://bots.159.69.107.254.nip.io/qr-vote` |

**Why this matters more than it looks:** the push is fire-and-forget with a 2.5-second timeout
and **zero retries**. If this URL is ever wrong, votes are lost silently — the vote row still
saves in this app's database, but the bot never learns of it, so a territorial manager quietly
fails their 30-minute store task with no error visible anywhere.

The Fly app is scheduled for deletion after **2026-08-13**, after which the old URL is gone for
good.

## How the change was made without losing a single vote

Worth copying if this ever has to be re-pointed again. An nginx proxy was placed on the new
address forwarding to the old Fly app; this Railway variable was updated **while Fly was still
serving**; only then was the backend swapped to the new container. At no point did a vote arrive
at a dead endpoint.

Changing a Railway variable triggers a redeploy of this service, so do it **once**, not
iteratively — this project runs under a ~$1/month budget.

## Why Pinbox itself was not migrated

Owner's explicit exclusion. It is worth restating the practical reasons:

- The domain `web-production-370c1.up.railway.app` is **printed on all 41 physical posters** in
  stores. Changing where this app answers means reprinting posters, which is a real-world cost
  no server migration justifies.
- It is small, cheap and working.

If it is ever reconsidered, the poster URL is the first constraint to solve, not the last.

## Related, on our own server

`~/.claude/SERVER.md` — server facts and rules.
`Territorail managers checklist/MIGRATION.md` — the other half of this integration.
