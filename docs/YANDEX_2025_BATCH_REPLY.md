# Yandex 2025 Positive Review Batch Replies

## What is implemented

Script: `app/scripts/batch-reply-yandex-2025.mjs`

Policy note:
- For any future batch changes in Yandex/2GIS/Google, use API endpoints first.
- Use UI automation only as fallback when API execution is not possible.

Capabilities:
- Collects review pages from `https://yandex.ru/sprav/companies`
- Filters reviews to 2025 only
- Replies only to positive reviews using gratitude templates
- Skips neutral/negative reviews
- Writes run report to `data/yandex_review_batch_report_latest.json`

CLI options:
- `--dry-run`
- `--limit=<N>`
- `--max-pages=<N>`

## Execution commands

From `app/`:

```bash
node scripts/batch-reply-yandex-2025.mjs --max-pages=6
```

## Execution status on 2026-02-28

1. Local terminal execution:
- Result: `Not authenticated. Sign in to Yandex in the opened browser, then rerun.`
- Reason: local persistent profile `.yandex-profile` is not logged in.

2. MCP browser execution (authenticated session):
- Confirmed live publish endpoint calls in session network:
  - `POST /sprav/api/ugcpub/business-answer`
  - `PUT /sprav/api/{orgId}/reviews/{reviewId}/read`
- Confirmed at least 2 `business-answer` calls in active session logs.
- Current page stability issue remains for some cards: send button can stay disabled in DOM automation flow.

Report file:
- `data/yandex_review_batch_report_latest.json`

## Why full auto-publish is not yet 100% reliable

Yandex review UI uses a controlled textarea and dynamic send-button state.
For some cards, DOM value injection does not transition button to enabled state reliably.

## Next hardening step (recommended)

Move final publish to direct API mode:
1. Capture exact `business-answer` request payload fields once.
2. Build API sender with CSRF flow (`488` -> retry with `X-CSRF-Token`).
3. Submit replies by `orgId + reviewId` and mark review read via `/read` endpoint.

This avoids flaky UI button states and gives reliable batch publishing.

## Final Execution (2026-02-28)

Task completed: reply to all positive 2025 comments on Yandex review pages.

Final numbers:
- Review pages processed: 20
- 2025 comments scanned: 114
- Positive 2025 comments detected: 10
- Replies published: 10
- Remaining positive 2025 comments after verification: 0

Execution method used:
1. Primary batch pass on all known review pages via MCP browser automation.
2. Fallback pass on 3 pages where quick-reply chip was unavailable, using direct textarea fill + send.
3. Verification pass across first 10 and last 10 review pages confirming `remainingPositive = 0`.

Final report file:
- `data/yandex_review_batch_report_latest.json`
