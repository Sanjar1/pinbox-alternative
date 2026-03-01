# 2GIS Logo and Media Policy Notes

Last verified: 2026-02-26

This file separates two different things in 2GIS:

1. Free company card media (photos/videos)
2. Paid advertising surfaces (where logo is explicitly mentioned)

## Free Card Media (Current Active Mode)

- Location: `Моя компания` -> `Фото и видео`
- Purpose: storefront/interior/products/price-list and related real photos
- Result for standalone logo image upload:
  - rejected by moderation
  - exact `blockReason`:
    - `Компьютерная графика, картинки, скриншоты (исключения — прайс-листы)`

Conclusion:
- A pure graphic logo file is not accepted as a regular photo in card media.

## Where Logo Is Explicitly Mentioned

Location in cabinet:
- `Реклама в 2ГИС` -> `Геореклама`

Page statement:
- `Логотип и рекламное объявление выделяют среди конкурентов`

Interpretation:
- Logo placement is part of advertising product features, not ordinary card photo gallery.

## API Evidence

From org business payload:
- `businessInfo.logoUrl` exists but was `null`.

From feature flags:
- `geoAdvertising=false`
- `signboard=false`
- `reviewspro=false`

Interpretation:
- logo-related commercial surfaces are currently not enabled for this org in self-serve mode.

## Practical Recommendation

1. For free card updates now:
- upload only real store/product photos.

2. If brand logo must be shown:
- use `Реклама в 2ГИС` (`Геореклама`) and submit consultation/onboarding request.

3. Keep media compliance checks against:
- `https://law.2gis.uz/informational-requirements/`
