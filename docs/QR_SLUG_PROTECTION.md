# QR Slug Protection — Frozen 2026-05-21

## The rule

**Never change any value in `QRCode.slug` in production.** Every slug
corresponds to a QR code on a physical paper poster that is already taped to
a wall in one of 41 cheese stores across Tashkent. Changing a slug breaks the
poster: scanning it gives a 404, and the only fix is reprinting and physically
re-distributing the poster to that store.

This rule was put in place on **2026-05-21** after the May 17/18 print run.
41 posters were verified live at production (HTTP 200 for all 41 slugs) and
distributed to managers.

## What's enforced where

| Layer | Mechanism | File | What it does |
|------|-----------|------|--------------|
| Data backup | Versioned JSON committed to git | `data/qr-links-frozen-2026-05-21.json` | Source of truth for the 41 slug → store mapping. If the DB is ever lost, this file is enough to rebuild every QR record. |
| Application code | Prisma client extension | `app/src/lib/db.ts` (`makePrisma`) | Rejects any `update`, `updateMany`, or `upsert` that includes `slug` in the write payload. Throws a clear error: `QRCode.slug is immutable …`. |
| Documentation | This file + `CLAUDE.md` + `DECISIONS.md` | — | Tells any future engineer / AI not to mess with slugs. |

## What's allowed

- **Creating new `QRCode` rows** with new slugs for new stores added AFTER 2026-05-21 — fine.
- **Incrementing the `scans` counter** on an existing `QRCode` — fine; the guard only fires when `slug` is in the write payload.
- **Updating other fields** on a `QRCode` (e.g. `name`, `storeId`) — fine.
- **Deleting a `QRCode`** — technically possible at the code level. Avoid unless you are also re-printing the poster.

## What's NOT allowed

- Running `prisma.qRCode.update({ data: { slug: '...' } })` anywhere in code.
- Running `UPDATE "QRCode" SET slug = ... WHERE ...` in a psql session against production.
- Writing a migration that touches the `slug` column on existing rows.
- Re-running any "regenerate slugs" / "import stores" script against production.

## If you need to change a slug anyway

You almost certainly do not. Re-read the rule above. If you absolutely must:

1. **Reprint the poster** for that store FIRST. Replace the physical poster.
2. **Distribute the new poster** to the store and wait until it is mounted.
3. **Confirm the old poster is removed** so no one can still scan the old slug.
4. Only then, update the slug in code via a one-off, audited script.
5. Add the change to `data/qr-links-frozen-YYYY-MM-DD.json` (a NEW dated file — do not edit the original) and link the new file from this doc.

## Restoring the slug mapping from backup

If the production DB is ever lost:

```bash
# Read the backup
cat data/qr-links-frozen-2026-05-21.json | jq '.links[] | [.slug, .poster] | @tsv'
```

Then for each row, recreate the `Store` and `QRCode` with the exact `slug` value. Slugs are 6-character hex; the printed QR encodes the URL `https://web-production-370c1.up.railway.app/<slug>`, so the slug MUST come back identical for the printed poster to resolve.

## Why the rule exists

In the May 18 session, the previous "ownership" of slugs was loose — the
`/api/admin/repair-a5-links` endpoint was used to repair a broken QR mapping
(creating new Glotok stores and clearing 14 test votes). That repair was
legitimate at the time because no physical posters were in the field yet.

After May 17/18, **41 posters are in 41 stores**. Any change to any slug is
now physically observable as a 404 when a customer scans. The cost of an
accidental slug change is hours of reprinting and store visits. The
protection above makes the accident impossible at the application layer.

## Related files

- `data/qr-links-frozen-2026-05-21.json` — the frozen mapping (backup + source of truth)
- `app/src/lib/db.ts` — Prisma extension that blocks slug writes
- `docs/qr-url-health-check-a5-2026-05-17.json` — the original 41-link audit
- `app/scripts/export-production-store-links.mjs` — re-runnable export script (for future backups)
