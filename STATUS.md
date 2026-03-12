# Status

**Updated:** 2026-03-11

## Current Phase

`Railway deployment preparation — QR feedback pilot ready to go live`

## Session Snapshot (2026-03-11)

- QR voting page fully redesigned with correct 2-step flow:
  - Step 1: Rate all 3 questions → click Submit → **vote saved to DB first**
  - Step 2 high (avg ≥ 4): show public platform links "Сделайте ваш голос публичным"
  - Step 2 low (avg < 4): show private comment form
  - Step 3: Thank you screen after comment sent
- Questions updated to final approved short versions (both UZ + RU)
- QR poster fully rewritten in clean Russian, all layout issues fixed:
  - Store name UPPERCASE (AVIASOZLAR) — rule applies to all posters
  - All text in Russian, no mixed languages
  - URL removed from footer
  - "Как вам у нас?" on one line
- Platform buttons with correct brand colors + icons:
  - Google Maps: #1A73E8 (Google blue)
  - Яндекс Карты: #FC3F1D (Yandex red)
  - 2ГИС: #1BA53E (2GIS green)
- Decision made: deploy to Railway for always-online production hosting
- SQLite → PostgreSQL migration required before Railway deploy

## What Works

1. QR feedback flow — complete 2-step UX, vote always saved before next step
2. Anti-abuse protection — device/IP throttling, 7-day vote limit
3. QR poster generator — Russian text, UPPERCASE store name, no URL, correct layout
4. Admin panel — store management, discovery, approval scaffold
5. Platform buttons — correct brand colors, real store URLs for Авиасозлар (Yandex + Google)

## What Is Blocked

1. **Railway deploy blocked** — SQLite must be migrated to PostgreSQL first
2. **Platform links** — 2GIS + Yandex links are still search queries for most stores (only Авиасозлар has real Yandex URL fixed)
3. Google Business batch 2 (14 stores) still waiting for quota reset

## Next Actions

1. Migrate database from SQLite → PostgreSQL (schema change + data export)
2. Push code to GitHub
3. Deploy to Railway
4. Set environment variables on Railway
5. Generate and print QR posters for all pilot stores using production URL
