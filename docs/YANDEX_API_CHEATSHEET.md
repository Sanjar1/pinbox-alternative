# Yandex Business API Cheat Sheet

> Discovered via browser session interception — use from within yandex.ru/sprav pages (session cookies auto-included).

**Base:** `https://yandex.ru/sprav/api/`

---

## Authentication / CSRF

All mutating endpoints require a CSRF token. Pattern:

1. Make the PUT/POST request → get back `488` with body `{"csrf":"TOKEN:TIMESTAMP"}`
2. Retry same request with header `X-CSRF-Token: TOKEN:TIMESTAMP` → get `200`

```js
async function yandexApi(url, body) {
  const csrfResp = await fetch(url, {
    method: 'PUT', credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const { csrf } = await csrfResp.json(); // 488 response gives token
  return fetch(url, {
    method: 'PUT', credentials: 'include',
    headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrf},
    body: JSON.stringify(body)
  });
}
```

---

## Endpoints

### 1. Add/Change User Role on a Store

```
PUT /sprav/api/company-roles/change
```

**Body:**
```json
{
  "role": "delegate",
  "permalink": 2605231525,
  "login": "user@gmail.com"
}
```

**Role values:**
- `"delegate"` = Представитель (Representative) — can edit store + respond to reviews
- `"owner"` = Владелец (Owner) — full control

**Full example (loop all stores):**
```js
(async () => {
  const orgIds = [2605231525, 51521899757 /* ... all 33 */];
  const login = 'dmigos95@gmail.com';

  // Get CSRF token
  const csrfResp = await fetch('/sprav/api/company-roles/change', {
    method: 'PUT', credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({role: 'delegate', permalink: orgIds[0], login})
  });
  const { csrf } = await csrfResp.json();

  for (const id of orgIds) {
    const r = await fetch('/sprav/api/company-roles/change', {
      method: 'PUT', credentials: 'include',
      headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrf},
      body: JSON.stringify({role: 'delegate', permalink: id, login})
    });
    console.log(id, r.status);
    await new Promise(res => setTimeout(res, 200));
  }
})()
```

---

### 2. Update Store Data (name, phones, urls, social links, hours, description)

```
PUT /sprav/api/update-company
```

**CRITICAL: This API requires a React-generated `fingerprint` field. Direct API calls without it return 444.**

**Working approach — fetch interceptor (confirmed working, 33/33 stores 200 OK):**
```js
// 1. Load store edit page (/sprav/{id}/p/edit)
// 2. Inject interceptor BEFORE clicking Save:
const origFetch = window.fetch;
window.fetch = async function(...args) {
  const url = typeof args[0]==='string' ? args[0] : args[0]?.url||'';
  let opts = args[1] || {};
  if (url.includes('update-company') && opts.method==='PUT' && opts.body) {
    const payload = JSON.parse(opts.body);
    // Modify what you need:
    payload.company.displayName = 'Сырная Лавка';
    payload.company.names = (payload.company.names||[]).map(n =>
      (n.value?.locale==='ru'||n.value?.locale==='uz')
        ? {...n, value:{...n.value, value:'Сырная Лавка'}} : n
    );
    if (!payload.attributes.includes('names')) payload.attributes.push('names');
    opts = {...opts, body: JSON.stringify(payload)};
    args = [args[0], opts];
  }
  return origFetch.apply(this, args);
};
// 3. Click "Сохранить изменения" — React sends save with correct fingerprint
//    Interceptor modifies the payload on-the-fly → 200 OK
```

**Company object fields React sends (required):**
`id, tycoon_id, permanent_id, type, displayName, address, is_online, names, phones, urls, publishing_status, rubrics, work_intervals, scheduled_work_intervals, emails, need_actualization, feature_values, photos, owner, price_lists, legal_info, not_for_search, all_feedback_rejected, service_profiles, moderationStatus, from_geosearch`

**Fields React EXCLUDES (cause 444 if included):**
`unified_work_intervals, localized_work_intervals, base_work_intervals, noAccess, object_role, is_top_rated, has_owner, has_active_feedback_request, service_area, profile, nail, ownershipRequest, fromGeosearch, geospam, rating`

**Top-level payload structure:**
```json
{
  "company": { ...company object... },
  "attributes": ["names"],
  "saveMethod": "put",
  "relocationData": null,
  "isActualization": false,
  "source": "newEditInfo",
  "fingerprint": "<react-generated-value>"
}
```

**`attributes` field** = list of fields changed. Required to tell API what to update.

**Social network values:** `telegram`, `vk`, `youtube`, `tiktok` ✓ | `instagram`, `facebook` ✗ (Meta banned in Russia)

**Company data location in page:**
```js
window.__PRELOAD_DATA.initialState.edit.navigation.company
```

---

### 3. Get Store Data (read)

No dedicated read endpoint discovered yet. Best approach:
- Navigate to `/sprav/{orgId}/p/edit` and read input values via JS
- Or intercept the page load XHR

---

### 4. URLs / Social Links (CRITICAL findings — 2026-02-27)

**How URLs are stored in company.urls:**
```json
{ "type": "social", "value": "https://t.me/SirnayaLavka_Uzb", "social_network": "telegram", "social_login": "SirnayaLavka_Uzb", "hide": false }
{ "type": "social", "value": "http://www.instagram.com/sirnayalavka.uz", "social_network": "instagram" }
{ "type": "social", "value": "http://www.facebook.com/sirnayalavka.uz", "social_network": "facebook" }
```

**Supported social_network values in UI dropdown:**
`telegram`, `vkontakte`, `youtube`, `odnoklassniki`, `twitter` (X), `viber`, `whatsapp`, `snapchat`

**Instagram & Facebook:** NOT in dropdown but accepted! Add via "Веб-сайт" option → paste Instagram/Facebook URL → Yandex auto-detects and stores as `social_network: "instagram"/"facebook"`. Confirmed 200 OK. May need moderation before appearing on public Maps.

**CRITICAL — 444 causes:**
1. Adding `"urls"` to the `attributes` array → always 444. **Never add "urls" to attributes.**
2. Clicking save with NO real UI form change → stale fingerprint → 444
3. Using wrong type values (`"url"`, `"website"`) → 444

**CRITICAL — What makes URL saves return 200:**
- Must have a REAL UI change (type in a form field, click Добавить) so React generates valid fingerprint
- Keep `attributes: []` (don't add "urls") — React omits it and Yandex uses the fingerprint
- company.urls can contain instagram/facebook as `type:"social"` entries

**Batch URL add approach:**
```js
// 1. Navigate to /sprav/{id}/p/edit
// 2. Inject interceptor (adds urls WITHOUT adding "urls" to attributes):
(function() {
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0]==='string' ? args[0] : (args[0]?.url||'');
    let opts = args[1] || {};
    if (url.includes('update-company') && opts.method==='PUT' && opts.body) {
      const payload = JSON.parse(opts.body);
      const urls = payload.company.urls || [];
      // Add Instagram if missing
      if (!urls.some(u => (u.social_network||'').includes('instagram') || (u.value||'').includes('instagram'))) {
        urls.push({hide:false, type:'social', value:'http://www.instagram.com/sirnayalavka.uz', social_network:'instagram'});
      }
      // Add Facebook if missing
      if (!urls.some(u => (u.social_network||'').includes('facebook') || (u.value||'').includes('facebook'))) {
        urls.push({hide:false, type:'social', value:'http://www.facebook.com/sirnayalavka.uz', social_network:'facebook'});
      }
      // Add Telegram if missing
      if (!urls.some(u => (u.social_network||'').includes('telegram') || (u.value||'').includes('t.me'))) {
        urls.push({hide:false, type:'social', value:'https://t.me/SirnayaLavka_Uzb', social_network:'telegram', social_login:'SirnayaLavka_Uzb'});
      }
      payload.company.urls = urls;
      // DO NOT add 'urls' to attributes — causes 444!
      opts = {...opts, body: JSON.stringify(payload)};
      args = [args[0], opts];
      window._urlsSent = JSON.stringify(urls);
    }
    const r = origFetch.apply(this, args);
    if (url.includes('update-company')) r.then(res => { window._urlsStatus = res.status; });
    return r;
  };
})();
// 3. Make a real UI change (click Добавить → Веб-сайт, type any char, then delete it)
// 4. Click "Сохранить изменения" — fingerprint is valid → 200
```

**Ratings API:**
```js
// GET store ratings/reviews for all stores (up to page 3)
const r = await fetch('/sprav/api/companies?limit=20&page=1', {credentials:'include'});
const data = await r.json();
// data.listCompanies[].rating, .reviewsCount, .id, .displayName
```

---

## All 33 Store Org IDs

```js
const ALL_ORG_IDS = [
  // Page 1
  2605231525, 46711213257, 51521899757, 68372174039, 73077844158,
  78130811373, 80285992156, 81444134916, 88969661261, 93021421517,
  // Page 2
  93653304255, 96275437524, 98808908571, 113993963061, 119087534313,
  119523779091, 133701096811, 134404129580, 140717986697, 140997774388,
  // Page 3
  143672341206, 146603754824, 160095672246, 168675219928, 189015626941,
  191697629628, 193938967033, 205196568796, 219043654252, 225503578112,
  // Page 4
  225833833825, 235345012305, 242380255215
];

// Stores where we are Владелец (Owner) — can manage roles:
const OWNED_IDS = [
  2605231525, 51521899757, 78130811373, 81444134916, 93653304255,
  98808908571, 113993963061, 119087534313, 119523779091, 133701096811,
  140717986697, 140997774388, 143672341206, 146603754824, 160095672246,
  168675219928, 189015626941, 191697629628, 193938967033, 205196568796,
  219043654252, 225833833825, 235345012305, 242380255215
];

// Stores where we are Представитель only (can edit data but not manage users):
const REPRESENTATIVE_IDS = [
  46711213257, 68372174039, 73077844158, 80285992156, 88969661261,
  93021421517, 96275437524, 134404129580, 225503578112
];
```

---

## Photos Upload / Logo

### Assign existing photo as logo (confirmed working, 28/28 stores 200 OK)

```
POST /sprav/api/company/{orgId}/upload-photo?source=media
```

**Requires CSRF** (standard 488 → retry pattern).

**Body:**
```json
{
  "fingerprint": null,
  "photos": [{
    "id": "2a0000019c9af2e3ae35b3364448d95f4b1d",
    "url": "https://avatars.mds.yandex.net/get-altay/18150755/2a0000019c9af2e3ae35b3364448d95f4b1d/orig",
    "tags": ["logo"],
    "moderation": {},
    "url_template": "https://avatars.mds.yandex.net/get-altay/18150755/2a0000019c9af2e3ae35b3364448d95f4b1d/%s",
    "time_published": 0
  }]
}
```

**Key findings:**
- `fingerprint` can be `null` (unlike `update-company`)
- `url` must be the direct CDN URL with `/orig` suffix (not `/M` or `/S`)
- `tags: ["logo"]` sets it as the logo (vs `["exterior"]`, `["interior"]`, etc.)
- The photo ID `2a0000019c9af2e3ae35b3364448d95f4b1d` is the Сырная Лавка logo already uploaded to the CDN

**Batch loop (all stores):**
```js
(async () => {
  const ORG_IDS = [2605231525, 46711213257, /* ... all 28 ... */];
  const photo = {
    id: '2a0000019c9af2e3ae35b3364448d95f4b1d',
    url: 'https://avatars.mds.yandex.net/get-altay/18150755/2a0000019c9af2e3ae35b3364448d95f4b1d/orig',
    tags: ['logo'], moderation: {},
    url_template: 'https://avatars.mds.yandex.net/get-altay/18150755/2a0000019c9af2e3ae35b3364448d95f4b1d/%s',
    time_published: 0
  };
  const csrfR = await fetch(`/sprav/api/company/${ORG_IDS[0]}/upload-photo?source=media`, {
    method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({fingerprint: null, photos: [photo]})
  });
  const {csrf} = await csrfR.json();
  for (const orgId of ORG_IDS) {
    const r = await fetch(`/sprav/api/company/${orgId}/upload-photo?source=media`, {
      method: 'POST', credentials: 'include',
      headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrf},
      body: JSON.stringify({fingerprint: null, photos: [photo]})
    });
    console.log(orgId, r.status);
    await new Promise(res => setTimeout(res, 150));
  }
})()
```

**First file upload** (to get a photo into the CDN — needed once):
- Endpoint: `POST https://photo.upload.maps.yandex.ru/api/v1/avatars?namespace=altay`
- Body: multipart FormData with the image file
- Returns photo URL/ID → use in `upload-photo` call above

---

## 5. Review Replies (Batch Processing via Browser)

### DOM Structure (Discovered 2026-02-28)
Review page: `/sprav/{orgId}/p/edit/reviews/`

```html
<div class="Review">
  <div class="Review-Header">
    <div class="Review-UserName">Author Name</div>
    <div class="Review-RatingDate">
      <span class="StarsRating StarsRating_value_8"></span>  <!-- value_N: N/2 = stars -->
      <span class="Review-Date">05 августа 2025</span>
    </div>
  </div>
  <div class="Review-Text">Review content goes here...</div>
  <!-- Unanswered: has textarea; Answered: no textarea, shows "Ответ компании" -->
  <textarea class="Reply-Textarea"></textarea>
  <button class="ya-business-yabs-button ya-business-yabs-button_disabled">
    <!-- Enabled when textarea has text via React events -->
  </button>
</div>
```

**Key findings:**
- Star rating: `StarsRating_value_N` where N = stars × 2 (value_2=1★, value_4=2★, value_6=3★, etc.)
- Unanswered review: has `<textarea>` element
- Answered review: no textarea, shows "Ответ компании" date instead
- Submit button: `ya-business-yabs-button` class, disabled until React gets input event

### In-Browser Batch Reply Function (Chrome Extension)

**React-controlled textarea requires native setter trick** (standard .fill() doesn't work):

```js
(async () => {
  const res = { url: location.href, sent: [], skipped: 0 };

  function buildReply(author, text) {
    const n = (author || '').trim();
    const t = (text || '').toLowerCase();
    let issue = 'произошедшую ситуацию';
    if (/персон|кассир|телефон|груб|невеж|хам/.test(t))
      issue = 'поведение сотрудника';
    else if (/просроч|испорч|качеств/.test(t))
      issue = 'качество товара';
    else if (/цен|дорог/.test(t))
      issue = 'ценовую политику';
    else if (/час|закрыт|не работает|режим/.test(t))
      issue = 'режим работы';

    return `${n ? n + ', ' : ''}добрый день! Сожалеем, что визит оставил негативное впечатление. ` +
           `Мы обязательно разберём ${issue}. ` +
           `Пожалуйста, свяжитесь: Telegram @SirnayaLavka_Uzb или +998 78 555 15 15. ` +
           `Надеемся на понимание и будем рады видеть вас снова!`;
  }

  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
  const cards = document.querySelectorAll('.Review');

  for (const card of cards) {
    // Get star rating
    const m = (card.querySelector('[class*="StarsRating_value_"]')?.className || '')
      .match(/StarsRating_value_(\d+)/);
    const stars = m ? parseInt(m[1]) / 2 : null;

    if (!stars || stars > 3) { res.skipped++; continue; }  // Skip 4-5★

    // Check if unanswered (has textarea)
    const ta = card.querySelector('textarea');
    if (!ta) { res.skipped++; continue; }

    // Check year (2025 or 2026 only)
    const date = card.querySelector('.Review-Date')?.innerText || '';
    if (!/202[56]/.test(date)) { res.skipped++; continue; }

    // Get author & text
    const author = card.querySelector('.Review-UserName')?.innerText?.trim() || '';
    const text   = card.querySelector('.Review-Text')?.innerText?.trim() || '';
    const reply  = buildReply(author, text);

    // Fill textarea using native setter (works with React)
    setter.call(ta, reply);
    ta.dispatchEvent(new Event('input',  { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(r => setTimeout(r, 500));

    // Click submit button (now enabled)
    const btn = card.querySelector('button.ya-business-yabs-button:not(.ya-business-yabs-button_disabled)');
    if (btn) {
      btn.click();
      await new Promise(r => setTimeout(r, 1000));
      res.sent.push({ author, stars, date: date.trim() });
    }
  }

  return JSON.stringify(res);
})()
```

**Usage in Claude-in-Chrome:**
```
1. mcp__claude-in-chrome__navigate to /sprav/{orgId}/p/edit/reviews/
2. mcp__claude-in-chrome__javascript_tool with above function
3. Returns: {sent: [{author, stars, date}, ...], skipped: N}
```

**Batch process all stores:**
Loop over all 33 org IDs, navigate + run function, collect results.

---

## Account Info

- **Account:** Sanjar Sanjar (ID: 1681626717)
- **Business:** Сырная Лавка — 33 stores in Tashkent, Uzbekistan
- **Shared user:** Дмитрий Осипов (dmigos95@gmail.com) — Представитель on all 24 owned stores
- **Chain request:** Submitted to sismatullaev@gmail.com, response expected in 5–7 days
