# Status

**Updated:** 2026-03-13

## Current Phase

`Production stabilization on Railway + UX/copy polish for QR voting flow`

## Session Snapshot (2026-03-13)

- Updated live voting question copy in Uzbek and Russian for grammatical clarity.
- Updated primary QR poster copy:
  - `Как вам у нас?` -> `Оставьте ваш отзыв`
  - supporting line -> `Ваше мнение важно для нас.`
- Synced same QR copy in poster generation script and generated HTML artifact.
- Corrected Uzbek product phrase to `Маҳсулот янги ва сифатлими?`.
- Commit pushed: `fd566ed` (`fix: correct voting and QR poster copy`).
- Railway deployment completed successfully: `beba68a3-efce-44e6-9b93-8b369fbb8ae7`.
- Updated Railway redeploy documentation (`RAILWAY_CHEATSHEET.md`, `DEPLOY_CLI_GUIDE.md`) for CLI-only reproducible deploys.
- Verified production pages:
  - `/poster/523da2` contains updated QR poster text.
  - `/523da2` contains updated UZ + RU voting questions (RU verified after language toggle).

## What Works

1. Railway production deployment pipeline (Dockerfile path) is healthy.
2. QR poster route renders final requested Russian copy.
3. Voting route renders corrected UZ and RU question text.
4. Direct map-card URL enforcement is active (no random search redirects).

## What Is Blocked

1. Some stores may still have missing/non-direct map links in DB, so platform buttons can be hidden until direct card URLs are saved.

## Next Actions

1. Review and normalize remaining store map URLs in admin (Google/Yandex/2GIS direct card links).
2. Regenerate/print final QR posters for pilot stores from production route.
3. Keep deployment docs synced whenever Railway CLI commands or service settings change.
