# Google Business Ownership Status (2026-02-27)

Account checked: `sismatullaev@gmail.com`

Approved business description text (RU):

`Магазин качественных сыров и молочных продуктов. Широкий выбор отечественных и импортных сортов. Свежая продукция каждый день.`

## Managed locations now

1. `Syrnaya Lavka` - `Abdurauf Fitrat ko'chasi 4, Tashkent`
   Status: `Processing`
   Store code: `01083990800331106501`
   FID: `7022877837922159990`

2. `Syrnaya Lavka` - `978R+2Q7, Yangi Shahar ko'chasi, 100194, Tashkent`
   Status: `Verified`
   Store code: `04445343178342222593`
   FID: `10854957917197044563`

3. `Syrnaya Lavka Kuylyuk` - `68PJ+H5R, Tashkent`
   Status: `Processing`
   Store code: `04773736263072149968`
   FID: `2943381179443995567`

4. `Syrnaya Lavka Ttz` - `993P+JFQ TTZ bazar, Tashkent`
   Status: `Processing`
   Store code: `13269299752577284755`
   FID: `16287832862762180124`

5. `Сырная Лавка` - `Near yakkasaroy street, Tashkent`
   Status: `Verified`
   Store code: `(empty)`
   FID: `12242063773800875924`

6. `Сырная Лавка` - `Tansiqboev ko'chasi 25, Tashkent`
   Status: `Processing`
   Store code: `11569504432881214481`
   FID: `16639199160416746131`

7. `Сырная Лавка` - `879P+G5P, Tashkent, Uzbekistan`
   Status: `Processing`
   Store code: `04732619173853016988`
   FID/LID: `5596989586233886836`
   Note: SMS verification code entered on 2026-02-27, flow moved to onboarding.

## Mapping to internal Excel rows

- Row `5` (`Лавка Олой`) -> `Сырная Лавка` at `879P+G5P` (`Processing`)
- Row `8` (`Лавка Бектемир`) -> `Syrnaya Lavka Kuylyuk` (`Processing`)
- Row `15` (`Лавка Аския`) -> `Сырная Лавка` near yakkasaroy (`Verified`)
- Row `20` (`Лавка Тансикбаев`) -> `Сырная Лавка` on `Tansiqboev ko'chasi 25` (`Processing`)
- Row `25` (`Лавка Рисовый`) -> two Google profiles (one `Verified`, one `Processing`)
- Row `28` (`Лавка ТТЗ`) -> `Syrnaya Lavka Ttz` (`Processing`)

## Current gap summary

- Total stores in Excel baseline: `35`
- Stores with known Google ownership in this account: `6` rows
- Managed profiles in account: `7` (row 25 has duplicate)
- Stores still needing search/claim in Google: `26`
- RUBA rows separated from Сырная Лавка flow: `3` (rows `33, 34, 35`)

## Current claim blockers

- Row `1` (`76G3+Q3P`): address rejected in claim wizard (`Google invalid address`).
- Row `18` (`88WW+Q56`): address rejected in claim wizard (`Google invalid address`).
- Row `19` (`Газалкент`): no direct card found from RU/EN query variants.
- Row `4` (`Сакичмон 1`): no direct card found; only already-known cards returned.
- Row `6` (`Паркент 74`): no direct card found; only already-known cards returned.
- Row `29` (`Навруз 7`): no direct card found; only already-known cards returned.
- Row `7` (`Лавка Буз бозор`): candidate card `Cheese Shop at Buz Bazar` found (`88HG+C5`, `+998 93 549 67 67`), but current account has no `Claim this business` / `Manage this business` CTA on this card.
- Row `16` (`Лавка Учтепа`): address query resolves to generic `Farkhad Bazaar` object (claimable market card), not a clear `Сырная Лавка` point; needs exact pin/store link.
- Row `19` (`Лавка Ялангач`): direct card found (`Syrnaya Lavka Yalangoch`, `88WW+Q56`) and claim flow starts, but fails at contact step with Google wizard `RpcError` (`try again later`).
- Row `33` (`Лавка Фергана`): direct card found (`Syrnaya Lavka`, `9QRQ+G9M`) and claim flow starts, but fails at contact step with Google wizard `RpcError` (`try again later`).
- Row `10` (`Лавка Катортол`): candidate card found (`Syrnyy Butik`, `76V6+5WX`, `+998 90 926 68 56`), but brand/phone mismatch requires owner confirmation before claim/rebrand.
