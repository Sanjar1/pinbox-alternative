# RUBA Store Creation Requests (2026-02-28)

## Objective
Create RUBA listings for missing locations in Yandex and 2GIS when not available and not pending.

## Source
- `data/stores_audit.xlsx` (rows 34-36 in Yandex/2GIS sheets)

## Stores to Create

1. RUBA - Урикзор
- Address: `Ташкент, Учтепинский район, Бурхониддин Маргинони 9`
- Phone: `+998 78 555 15 15`
- Hours: `07:00-18:00`, `Ежедневно`

2. RUBA - Сергели оптом
- Address: `Ташкент, Сергелийский район, мсг Фарогатли`
- Phone: `+998 78 555 15 15`
- Hours: `08:00-18:00`, `Ежедневно`

3. RUBA - Бухара
- Address: from map link (`data row 36`)
- Phone: `+998 78 555 15 15`
- Hours: `08:00-18:00`, `Ежедневно`

## Yandex Execution Result

Checked:
- `https://yandex.ru/sprav/companies`
- `https://yandex.ru/sprav/requests/` (pages 1..19)
- `https://yandex.ru/sprav/add`

Result:
- No RUBA entries found in companies.
- No RUBA pending requests found.
- Add flow reached step `Где вы находитесь?` but address validation failed for tested RUBA addresses with message:
  - `Нет допустимых значений`

Blocking condition:
- Yandex add form requires selectable validated address candidate; current RUBA inputs are not accepted in this session.

## 2GIS Execution Result

Checked:
- `https://account.2gis.com/orgs`

Result:
- RUBA org/branch context is not available in current session to submit branch/company creation from business cabinet flow.

Blocking condition:
- Missing active org/branch context and IDs for RUBA in current account session.

## Additional execution (2026-02-28)

- Yandex review batch was executed via MCP and published all detected unanswered positive 2025 replies.
- Result:
  - Review pages processed: `11`
  - Positive 2025 comments found: `10`
  - Replies published: `10`
  - Errors: `0`
- Report file:
  - `data/yandex_review_batch_report_latest.json`

## Request Payload (Ready)

Use this exact data when platform UI/API allows submission:

```json
[
  {
    "brand": "RUBA",
    "location": "Урикзор",
    "city": "Ташкент",
    "address": "Ташкент, Учтепинский район, Бурхониддин Маргинони 9",
    "phone": "+998785551515",
    "hours": "07:00-18:00",
    "days": "Ежедневно",
    "category": "Магазин продуктов"
  },
  {
    "brand": "RUBA",
    "location": "Сергели оптом",
    "city": "Ташкент",
    "address": "Ташкент, Сергелийский район, мсг Фарогатли",
    "phone": "+998785551515",
    "hours": "08:00-18:00",
    "days": "Ежедневно",
    "category": "Магазин продуктов"
  },
  {
    "brand": "RUBA",
    "location": "Бухара",
    "city": "Бухара",
    "address_source": "https://yandex.uz/maps/10330/bukhara/?ll=64.404903%2C39.781670&mode=search&sll=64.401806%2C39.779750&text=39.779750%2C64.401806&utm_source=share&z=15.07",
    "phone": "+998785551515",
    "hours": "08:00-18:00",
    "days": "Ежедневно",
    "category": "Магазин продуктов"
  }
]
```

## Logo Upload Note

Final file prepared and kept:
- `data/roba_logo_only.jpg`

Upload can be executed immediately after successful listing creation and ID assignment.
