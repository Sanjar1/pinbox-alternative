# Design — Territorial-Manager-grouped Telegram reports

**Date:** 2026-06-06
**Status:** Awaiting user approval (template + words)
**Scope:** Daily and weekly QR-feedback Telegram reports

---

## 1. Goal

Rework the daily and weekly Telegram reports so that, instead of one flat list
of 43 stores, the manager group sees:

1. A short company-wide summary (unchanged in spirit).
2. A **Top-5 stores** leaderboard.
3. One block **per territorial manager (TM)** — there are 4 — each showing that
   TM's totals, their average score, how many of their stores are silent, the
   names of the silent stores, and a **motivational line whose tone adapts to
   the result** (praise when good, "мы подвели клиента" when scores drop,
   accountability/shaming when many stores are silent).

The TM → store mapping comes from the user's Google Sheet ("Менеджеры" tab) and
must stay in sync automatically.

Non-goals: changing the monthly report; changing how feedback is collected;
touching QR slugs (frozen — see `docs/QR_SLUG_PROTECTION.md`).

---

## 2. The 4 territorial managers (from the sheet, 2026-06-06)

| Territorial manager | Stores | Active in sheet |
|---|---|---|
| Хасанов Даврон | 11 | yes |
| Абдухамитова Арофат | 11 | yes |
| Музаффаров Фазлиддин | 10 | yes |
| Юсупова Дурдона | 9 | no (still shown in report) |

Total assigned: **41**. The 2 remaining active stores — **Катортол** and
**Чилонзор Торговый** — have no TM in the sheet (see §7).

---

## 3. Data source & sync

### 3.1 Storage (what the live report reads)
Add a single nullable column to `Store`:

```prisma
model Store {
  ...
  territorialManager String?   // TM full name, e.g. "Хасанов Даврон"; null = unassigned
}
```

Additive migration only. No existing column is altered. The Prisma slug-guard in
`app/src/lib/db.ts` is unaffected (it only blocks `slug` writes).

The report groups stores by `store.territorialManager`. Reading from the DB means
manager changes take effect on the **next report** with no redeploy.

### 3.2 Sync job (sheet → DB)
- A new module `app/src/lib/manager-sync.ts` reads the "Менеджеры" tab via the
  **Google Sheets API using a service account** (read-only).
- Credentials: one Railway env var `GOOGLE_SERVICE_ACCOUNT_JSON` (the service
  account key). The sheet is shared read-only with the service account email.
- Sheet ID: `1N7Ysr2C8ivoXAbU0fZc07_aDFAvDhny-M5Zg2yxDgkw`, tab gid `1105476357`.
- The sync normalizes each sheet store name, matches it to a DB store (§4), and
  upserts `store.territorialManager`.
- Exposed as `POST /api/admin/sync-managers` (protected by the existing
  `REPORTS_API_KEY` bearer check, reusing `checkApiKey`).
- **Ordering (no race):** the sync runs as the **first step of the existing daily
  report workflow**, immediately before the report step — not as a separate timed
  cron. GitHub scheduled crons drift 5–15 min, so two independent crons could fire
  out of order; chaining them in one job guarantees sync-then-report. The sync step
  uses `continue-on-error` so a sync failure never blocks the report — the report
  then runs on the last-good DB/seed mapping (and the failure is visible in the
  Action log + Railway log).
- Structured logging via the existing `reportLog` pattern (tag, reqId, counts,
  unmatched names, `used: "live" | "fallback"`) so a bad/stale sync is greppable.

### 3.3 Fallback / seed
- A committed snapshot `app/data/manager-assignments.json`
  (`{ "<DB store name>": "<TM name>" }`) is generated now from the sheet.
- On first run, or if the Sheets fetch fails, the sync seeds/falls back to this
  file and logs `manager_sync_fallback`. The report therefore **never breaks**
  on a transient Google outage — it uses the last-known mapping.

---

## 4. Name matching (the one fragile part)

Sheet names are prefixed and spelled differently from DB names. Examples:

| Sheet | DB |
|---|---|
| `Лавка Эко ` | `ЭКО` |
| `Лавка Ялангоч` | `Ялангач` |
| `Лавка Янги хает` | `Янги Хаёт` |
| `Лавка Фуд сити` | `Food city` |
| `Лавка ЦУМ` | `Цум` |
| `Ruba Бухара` | `Бухара` |
| `Глоток Панелный` | `Глоток Панельный` |

Approach:
1. Normalize: strip ONLY the `Лавка ` and `Ruba ` prefixes, lowercase, trim,
   drop punctuation, fold `ё→е` and `ў/ҳ` variants.
   - **Do NOT strip `Глоток`.** `Глоток Юнусабад` and `Глоток Панельный` are
     distinct DB stores; stripping the prefix would collapse `Глоток Юнусабад`
     onto the real `Юнусабад` store and silently assign it to the wrong TM. These
     two are pinned as **exact aliases** in the alias table before normalization.
2. A small explicit **alias table** in `manager-sync.ts` resolves the ~12 names
   that still don't match after normalization (including the two `Глоток` stores).
3. **Hard requirements** (implementation is not "done" until all pass):
   - Every sheet store matches a DB store: **41/41**. Unmatched = loud log line.
   - **No two sheet rows resolve to the same `Store.id`** — a post-match assertion
     that catches collisions like the `Глоток` case. A collision is a hard error.
   - The sync is **update-only**: it calls `prisma.store.update`/`updateMany` on
     matched ids and **never creates a Store** (creating a store mints a QR slug —
     see `create-missing-stores`). A non-matching row is logged, never inserted.

> The exact DB store names will be read from the production/seed data during
> implementation to build and verify the alias table.

---

## 5. Daily report format

Rendered with the real 5 June 2026 numbers (monospace = `<pre>` block):

```
Ежедневный отчёт по QR-отзывам — 5 июня 2026

Сводка:
Всего отзывов: 60 · средняя 5.0
Магазинов с отзывами: 12 из 43 · без отзывов: 31

🏆 Топ-5 магазинов дня:
1. Аская — 26 — 5.0      (sorted by count → avg → name)
2. Чирчик — 15 — 5.0
3. ЭКО — 8 — 4.9
4. Чорсу — 3 — 5.0
5. Авайхон — 1 — 5.0

──────────────

👤 Хасанов Даврон — 30 отзывов · средняя 5.0
Аския         26   5.0          (reviewed stores, monospace table,
Чорсу          3   5.0           sorted by count → avg → name)
Янги Хаёт      1   5.0
Молчат: Учтепа, Тансикбаев, Фарход, Торговый Центр, Янгиюль, Бухара, Урикзор, Келес
8 из 11 магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.

👤 Абдухамитова Арофат — 16 отзывов · средняя 5.0
Чирчик        15   5.0
Навруз         1   5.0
Молчат: Юнусабад, Госпитальный, ТТЗ, Корасув, Сайрам, Газалкент, Хасанбой, Самарканд, Глоток Юнусабад
9 из 11 магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.

👤 Музаффаров Фазлиддин — 12 отзывов · средняя 4.9
ЭКО            8   4.9
Авайхон        1   5.0
Глоток Панельный 1 5.0
Фергана        1   5.0
Ялангач        1   5.0
Молчат: Буз бозор, Чилонзор 21, Рисовый, Метро Чиланзар, Панельный
5 из 10 магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.

👤 Юсупова Дурдона — 2 отзыва · средняя 5.0
Сергели оптом  1   5.0
Цум            1   5.0
Молчат: Авиасозлар, Олой, Кадышева, Бектемир, Паркентский, Food city, Дубовый
7 из 9 магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.
```

Rules:
- Top-5 is global, sorted by review count → avg → name; stores with 0 reviews are
  never in the Top-5.
- TM blocks are ordered by the TM's review count desc.
- Within a block:
  - A monospace table lists the stores **that received reviews** (name, count,
    avg), sorted by count → avg → name.
  - `Молчат: <names>` lists every silent store (0 reviews) by DB name.
  - The universal silent line (§8) closes the block, with `{silent}`/`{total}`
    filled in.
- A TM with 0 total reviews: no table rows, `Молчат:` lists all its stores, and
  the universal line reads "{total} из {total} магазинов молчат …".
- A TM with 0 silent stores: omit the `Молчат:` line; the universal line is
  replaced by "Все магазины с отзывами ✅".
- **Fully empty day** (0 reviews anywhere): render the `Сводка` and replace the
  Top-5 section with "🏆 Топ-5: отзывов сегодня не поступало." TM blocks each show
  "0 отзывов" with all stores in `Молчат:`. Never render an empty Top-5 heading.
- Telegram 4096-char limit: keep the existing multi-part splitting; split on TM
  block boundaries so a block is never cut in half.

### Unassigned-store footnote
On days the 2 unassigned stores receive reviews, the 4 TM blocks won't sum to the
global total (gap = their reviews). To keep the math honest and readable, add a
one-line footer when their review count > 0:
`Без менеджера (Катортол, Чилонзор Торговый): {n} отзывов` — so nothing looks like
a bug. When their count = 0 the footer is omitted.

### Global totals (decided)
Global `Сводка` and Top-5 count **all 43 active stores** — denominator stays
**43**. The 2 unassigned stores (Катортол, Чилонзор Торговый) get no TM block and
aren't named in any block, but their reviews still flow into the global totals so
a real review is never silently dropped. The per-TM blocks sum to 41; the 2-store
gap is a quiet reminder to assign them in the sheet.

---

## 6. Weekly report format

Same structure as daily, with weekly wording and the week's totals:
- Heading: `Отчёт за неделю — <range>`.
- Same `Сводка`, `🏆 Топ-5 магазинов недели`, and the 4 TM blocks.
- Replaces the current monospaced `<pre>` table entirely.
- Monthly report is left unchanged this round.

**Implementation note (not just copy-paste):** the current weekly builder only
fetches feedbacks and groups by `feedback.store.name`. To get silent stores and
per-TM totals it must adopt the daily path's `prisma.store.findMany({ archivedAt:
null })` query and group by **store id** (not name). The daily and weekly builders
should share one helper that takes a date range and returns the grouped structure,
so the two reports can't drift. This is the bulk of the weekly work.

---

## 7. Edge cases

- **Inactive TM (Юсупова Дурдона):** shown as a normal block. "Active in sheet"
  status does not affect the report.
- **Unassigned stores (Катортол, Чилонзор Торговый):** no TM block, not named
  (see §5 "Global totals" for the totals decision).
- **A store in the sheet that doesn't match any DB store:** logged loudly, sync
  treats it as a hard issue to fix (must reach 41/41).
- **A new DB store with no sheet entry:** `territorialManager` stays null → no
  block, counted in global totals; appears once assigned in the sheet.
- **Sheet unreachable:** fall back to committed seed, log it, report still sends.

---

## 8. Motivational line (universal — final)

One fixed line closes every TM block (no conditional buckets):

```
{silent} из {total} магазинов молчат — продавцы не просят оценить. Нет голоса = нет работы с клиентом.
```

- `{silent}` = stores in the block with 0 reviews; `{total}` = stores in the block.
- Special case: if `{silent}` = 0, replace the line with `Все магазины с отзывами ✅`.
- No global tagline.

---

## 9. Files to change (surgical)

| File | Change |
|---|---|
| `app/prisma/schema.prisma` | + `territorialManager String?` on `Store` |
| `app/prisma/migrations/...` | new additive migration |
| `app/src/lib/manager-sync.ts` | **new** — Sheets read, normalize, match, upsert |
| `app/data/manager-assignments.json` | **new** — committed seed/fallback |
| `app/src/app/api/admin/sync-managers/route.ts` | **new** — protected sync endpoint |
| `app/src/lib/report-builder.ts` | shared range→grouped helper; rework daily + weekly builders to TM grouping; add Top-5 + universal line |
| `.github/workflows/daily-telegram-report.yml` | add a sync step before the report step (`continue-on-error`) |
| `.github/workflows/` (weekly report workflow) | same sync-then-report chaining |
| Railway + GitHub secrets | + `GOOGLE_SERVICE_ACCOUNT_JSON` |

The monthly builder, Telegram send logic, auth, and ranges are reused unchanged.
No separate sync cron is created (avoids the cron-drift race).

---

## 10. Testing & verification

- Unit-test the name normalizer + alias table → assert **41/41** sheet names map.
- Unit-test the report builder with the 5 June fixture → assert the rendered
  text matches the §5 template (totals reconcile to 60 / 12 / 43).
- Unit-test each motivational bucket selects correctly at its boundary.
- Assert no two sheet rows map to the same store id (the Глоток-collision guard).
- Run `/api/admin/sync-managers` against a test DB; confirm
  `territorialManager` populated for 41 stores, 2 null, 0 unmatched in logs, and
  that store count is unchanged (sync created nothing).
- Boundary unit tests: TM with 0 reviews → "11 из 11 … молчат"; TM fully covered
  → "Все магазины с отзывами ✅"; fully empty day → Top-5 fallback line.
- Trigger the daily report against the running app; **paste a real Telegram-client
  screenshot** (to confirm the `<pre>` Cyrillic columns actually align on mobile)
  **plus** the structured log trace as behavioral proof before calling it done.

---

## 11. Open items

All product decisions are resolved (universal line §8, reviewed-store tables +
named silent stores §5, denominator 43 §5, weekly mirrors daily §6, service-account
sync §3). The only items that surface during **implementation** (not blocking
approval):

- Read real DB store names to build/verify the alias table → must reach 41/41.
- Obtain the Google service-account key and share the sheet with it; add
  `GOOGLE_SERVICE_ACCOUNT_JSON` to Railway + GitHub Actions secrets.
