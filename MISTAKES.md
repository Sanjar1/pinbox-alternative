# Mistakes and Lessons Learned

## 2026-05-18 - Railway CLI deploy timed out due to un-ignored large files

- **What happened:** `railway up` from `app/` kept timing out during upload even though the source code is small.
- **Root cause:** `app/test-output/` (47MB of poster PNG images) was not in `.gitignore`, so Railway CLI included every file in the upload snapshot.
- **Lesson:** Before any CLI deploy, check `app/.gitignore` for generated output directories. Railway respects `.gitignore`; anything not ignored gets uploaded. 47MB → timeout.

## 2026-05-18 - Assumed GitHub auto-deploy would pick up push immediately

- **What happened:** Pushed to `main`, waited, saw an existing deployment go to SUCCESS — assumed it was from my push. It was a pre-existing deployment of old code. The new routes were absent in production.
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
