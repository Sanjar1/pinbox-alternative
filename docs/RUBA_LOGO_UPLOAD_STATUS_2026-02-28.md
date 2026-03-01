# RUBA Logo Upload Status (2026-02-28)

## Final Logo Asset

Kept file:
- `data/roba_logo_only.jpg`

Removed files:
- `data/roba_logo_only.png`
- `data/roba_logo_only.pdf`

## Excel Source Check

Source file:
- `data/stores_audit.xlsx`

RUBA rows detected:
- Yandex sheet rows: 34, 35, 36
- 2GIS sheet rows: 34, 35, 36

Current ID status from Excel:
- Yandex Org ID: missing for all 3 RUBA rows
- 2GIS Branch ID: missing for all 3 RUBA rows

## Live Cabinet Verification

### Yandex

Checked pages:
- `https://yandex.ru/sprav/companies` (paginated scan)

Result:
- No company entries with name containing `RUBA`
- No RUBA Org IDs available yet in current cabinet

Conclusion:
- Logo upload to Yandex cannot be executed until RUBA cards receive Org IDs / appear in cabinet.

### 2GIS

Checked page:
- `https://account.2gis.com/orgs`

Result in this session:
- No usable org list for RUBA upload operations in current account context.

Conclusion:
- 2GIS logo upload cannot be executed from this session without RUBA org/branch access and IDs.

## What Is Ready Programmatically

As soon as IDs are available, run API-first workflow:

1. Yandex:
- upload logo via `/sprav/api/company/{orgId}/upload-photo` flow (with CSRF)
- attach uploaded media as logo for each RUBA org

2. 2GIS:
- if media endpoint/access is available for RUBA org, upload logo by branch/org media API
- if media API is unavailable, perform UI fallback in cabinet and log result

## Upload Checklist to Execute Immediately After IDs Appear

For each RUBA store:
1. Confirm listing ownership/visibility in platform cabinet
2. Record platform ID (Yandex Org ID / 2GIS Branch ID)
3. Upload `data/roba_logo_only.jpg`
4. Verify logo visible in listing profile
5. Update `data/stores_audit.xlsx` status columns

## Notes

- Working hours and location setup remain separate from logo upload and should be applied once listings are active.
- Batch policy remains API-first for Yandex/2GIS/Google; UI is fallback only.
