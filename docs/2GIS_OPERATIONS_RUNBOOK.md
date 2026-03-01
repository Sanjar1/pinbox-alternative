# 2GIS Operations Runbook

Last verified: 2026-02-26

Practical runbook for recurring manual operations in the 2GIS cabinet.

## Batch Changes Rule

- For mass updates, prefer 2GIS API endpoints over manual cabinet actions.
- API-first execution is faster and more reliable.
- Use browser UI only for gaps where API behavior is unavailable.

## Session Context

- Org: `Сырная лавка` (`70000001036827089`)
- Branches: `27` (includes pending moderation branch)
- Main branch used for checks: `70000001036827090`

## Excel-First Coordinate Sync

Source of truth:
- `data/stores_audit.xlsx`

Sync script:
- `python scripts/sync_2gis_from_excel_by_coords.py`

Output files:
- `data/2gis_coordinate_sync_report.json`
- `data/2gis_hours_updates_result.json`

Matching rules:
- Uses exact coordinates only (pin-to-pin).
- Reads `lat/lon` from Excel when such columns exist.
- If no `lat/lon`, tries to parse from Yandex URL parameters.
- If still missing, falls back to Yandex org page coordinate extraction.

Current limitation observed on 2026-02-26:
- Yandex org-page requests are currently blocked by SmartCaptcha for this environment.
- Result: coordinate extraction from `/maps/org/{id}` fails with `captcha_blocked`.

Operational guidance:
1. Keep Excel as source of truth for names/hours/phone.
2. Add explicit `lat` and `lon` columns in Excel for each row to bypass Yandex captcha dependency.
3. Re-run sync script after pins are filled.
4. Apply automatic hour updates only after coordinate matches are present.

## Login

1. Open `https://account.2gis.com`.
2. Sign in with account owner credentials.
3. Open org page:
- `https://account.2gis.com/orgs/70000001036827089/company`

## Brand Split Rule (RUBA)

Rule used in operations:
- `Сырная лавка` and `RUBA` are different brands.
- Do not add `RUBA` locations as `Сырная лавка` branches.

Observed workflow:
1. Open `Добавить компанию` in account cabinet.
2. Search city `Toshkent` and company name `RUBA`.
3. If not found, use `Добавить новую компанию в 2ГИС`.
4. Submit new company card request for `RUBA`.

Observed result:
- Request accepted with status screen `Заявка отправлена`.

## Add Missing Branch (Company-Level)

1. Go to `Данные о компании`.
2. Click `Добавить филиал`.
3. Set city in `Населенный пункт` (example: `Toshkent`).
4. Enter address and pick exact suggestion from dropdown.
5. Click `Продолжить`.
6. Fill branch card and click `Добавить филиал`.

Observed result on success:
- Branch enters moderation and appears with temporary id format `branch_<id>`.
- Example: `branch_69a08c05deaad` for `Буюк Турон, 73`.

Important limitation:
- Some addresses from external source may not produce selectable suggestions.
- If no valid suggestion appears, manual map pick / address normalization is required before submit.

### API variant (confirmed)

Endpoint:
- `POST https://api.account.2gis.com/api/1.0/branches`

Minimum working payload shape (confirmed):
```json
{
  "orgId": "70000001036827089",
  "name": "Сырная лавка, магазин, ООО Cheese Day",
  "address": "Чиланзар Ц квартал микрорайон, 8а/6",
  "buildingId": "70030076171776706",
  "contacts": [],
  "city": {
    "id": "70030076171122914",
    "name": "Ташкент",
    "type": "byGeometryId",
    "originalName": null
  }
}
```

Notes:
- `contacts` must be an array.
- `buildingId` must come from a real 2GIS building suggestion/result.
- Response returns temporary moderation id (`branch_<id>`).
- Pending `branch_<id>` cards were not deletable/editable via tested API methods in this account context.

## Change Shared Customer Phone

1. Go to `Данные о компании`.
2. In `Контакты`, open phone row.
3. Replace value.
4. Save.
5. Confirm moderation banner appears.

Verified change:
- old: `+998 97-711-15-15`
- new: `+998 78-555-15-15`

## Remove Company Email (No Public Email)

1. Go to `Данные о компании` -> `Контакты`.
2. Open email row.
3. Clear email value.
4. Click `Сохранить`.
5. Verify email row is replaced by `Добавить email`.

Verified result:
- `lavkasira@mail.ru` removed from company contacts.

## Verify Contact Applied for All Branches

1. Open any other branch in org list.
2. Check contacts section.
3. Ensure label indicates shared contacts for all branches.

Verified:
- shared call-center phone propagated across branches.

## Media Upload / Moderation Check

1. Open `Фото и видео`.
2. Upload owner photo.
3. Check `Заблокированные` album if not visible in active albums.
4. Use blocked media reason to decide next upload.

Observed moderation result for logo-style image:
- status: `blocked`
- reason: `Компьютерная графика, картинки, скриншоты (исключения — прайс-листы)`

## Rules Link

- `https://law.2gis.uz/informational-requirements/`

## Safety Notes

- Do not store plaintext passwords in project docs.
- Record org/branch IDs and endpoint behavior, not credentials.
