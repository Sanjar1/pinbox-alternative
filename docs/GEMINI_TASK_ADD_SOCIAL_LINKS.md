# Task: Add Instagram & Facebook to All Yandex Business Store Profiles

## Your Mission
Add Instagram and Facebook social links to all 33 Сырная Лавка stores on Yandex Business (yandex.ru/sprav). This must be done via the browser UI (not direct API calls) because the API requires a React-generated fingerprint.

---

## Credentials / Account
- **Yandex account:** sismatullaev@gmail.com (already logged in — use existing browser session)
- **Business name:** Сырная Лавка
- **Instagram to add:** https://www.instagram.com/sirnayalavka.uz/
- **Facebook to add:** https://www.facebook.com/sirnayalavka.uz/

---

## CRITICAL Technical Rules (read carefully before starting)

1. **NEVER** add `"urls"` to the `attributes` array in any API payload — it causes HTTP 444 error
2. **NEVER** try to call the update-company API directly — requires React fingerprint
3. **Always** trigger a real UI form change before clicking save — otherwise fingerprint is invalid → 444
4. The correct approach: use the browser UI "Добавить → Веб-сайт" button, paste URL, click save
5. Yandex auto-detects Instagram/Facebook URLs and stores them as proper social networks

---

## How It Works (confirmed working on store 2605231525)

For **each store**, do this sequence:
1. Navigate to `https://yandex.ru/sprav/{ORG_ID}/p/edit`
2. Scroll down to the **"Сайт и социальные сети"** section
3. Check if Instagram is already there (look for `instagram` in the URL list)
4. If NOT there: click **"Добавить"** button → click **"Веб-сайт"**
5. Type: `https://www.instagram.com/sirnayalavka.uz/`
6. If Facebook NOT there: click **"Добавить"** again → **"Веб-сайт"** → type: `https://www.facebook.com/sirnayalavka.uz/`
7. Scroll down and click **"Сохранить изменения"**
8. Wait for success (no error toast) → move to next store

**Alternative JS interceptor approach** (faster — use this if you have JS execution):
```js
// Step 1: Inject interceptor (adds Instagram/Facebook WITHOUT adding "urls" to attributes)
(function() {
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0]==='string' ? args[0] : (args[0]?.url||'');
    let opts = args[1] || {};
    if (url.includes('update-company') && opts.method==='PUT' && opts.body) {
      const payload = JSON.parse(opts.body);
      const urls = payload.company.urls || [];
      if (!urls.some(u => (u.value||'').includes('instagram') || (u.social_network||'') === 'instagram')) {
        urls.push({hide:false, type:'social', value:'http://www.instagram.com/sirnayalavka.uz', social_network:'instagram'});
      }
      if (!urls.some(u => (u.value||'').includes('facebook') || (u.social_network||'') === 'facebook')) {
        urls.push({hide:false, type:'social', value:'http://www.facebook.com/sirnayalavka.uz', social_network:'facebook'});
      }
      if (!urls.some(u => (u.value||'').includes('t.me') || (u.social_network||'') === 'telegram')) {
        urls.push({hide:false, type:'social', value:'https://t.me/SirnayaLavka_Uzb', social_network:'telegram', social_login:'SirnayaLavka_Uzb'});
      }
      payload.company.urls = urls;
      // CRITICAL: do NOT push 'urls' to payload.attributes
      opts = {...opts, body: JSON.stringify(payload)};
      args = [args[0], opts];
      window._socialStatus = 'intercepted';
    }
    const r = origFetch.apply(this, args);
    if (url.includes('update-company')) r.then(res => { window._socialStatus = res.status; });
    return r;
  };
})()

// Step 2: Trigger a REAL UI change — click Добавить → Веб-сайт → type one character then delete it
// This is mandatory to generate a valid React fingerprint

// Step 3: Click save
const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Сохранить изменения');
if (btn) btn.click();

// Step 4: Check result
// window._socialStatus should be 200
```

---

## All 33 Store Org IDs (process all of them)

```js
const ALL_ORG_IDS = [
  // Already done (skip if Instagram+Facebook already present):
  2605231525,  // ✅ Done — Instagram+Facebook added
  // Process these:
  46711213257, 51521899757, 68372174039, 73077844158,
  78130811373, 80285992156, 81444134916, 88969661261, 93021421517,
  93653304255, 96275437524, 98808908571, 113993963061, 119087534313,
  119523779091, 133701096811, 134404129580, 140717986697, 140997774388,
  143672341206, 146603754824, 160095672246, 168675219928, 189015626941,
  191697629628, 193938967033, 205196568796, 219043654252, 225503578112,
  225833833825, 235345012305, 242380255215
];
```

---

## Step-by-step for each store

For each `orgId` in `ALL_ORG_IDS`:

1. Go to `https://yandex.ru/sprav/{orgId}/p/edit`
2. Wait for page to load (check page title changes from loading to store name)
3. Read current URLs from preload data:
   ```js
   const c = window.__PRELOAD_DATA?.initialState?.edit?.navigation?.company;
   JSON.stringify((c?.urls||[]).map(u=>({sn:u.social_network, val:u.value})))
   ```
4. If Instagram AND Facebook are already present → skip to next store
5. If missing: inject interceptor (code above)
6. Trigger UI change: find the "Добавить" button in "Сайт и социальные сети" section, click it, click "Веб-сайт", type one character in the input field (this creates a real UI change for fingerprint validity)
7. Click "Сохранить изменения"
8. Verify `window._socialStatus === 200`
9. Log result: `console.log(orgId, window._socialStatus)`
10. Wait 500ms, proceed to next store

---

## What success looks like
- HTTP 200 from update-company
- Fresh preload data on next page load shows:
  ```json
  {"type":"social","social_network":"instagram","value":"http://www.instagram.com/sirnayalavka.uz"}
  {"type":"social","social_network":"facebook","value":"http://www.facebook.com/sirnayalavka.uz"}
  ```
- No error toast "Не удалось сохранить"

## What failure looks like
- HTTP 444 → fingerprint was invalid (no real UI change was made) — retry with a real form interaction
- Error toast → retry

---

---

## Verification (run after each store save)

After clicking save and before moving to next store, verify:
```js
// Wait 1 second then check:
const status = window._socialStatus;
const intercepted = window._socialStatus === 200 || window._socialStatus === 'intercepted';

// Re-read from page (reload or check updated state)
// On NEXT page load for this store, run:
const c = window.__PRELOAD_DATA?.initialState?.edit?.navigation?.company;
const urls = (c?.urls||[]);
const hasIG = urls.some(u => u.social_network === 'instagram' || (u.value||'').includes('instagram'));
const hasFB = urls.some(u => u.social_network === 'facebook' || (u.value||'').includes('facebook'));
const hasTG = urls.some(u => u.social_network === 'telegram' || (u.value||'').includes('t.me'));
JSON.stringify({orgId: 'CURRENT_ID', hasIG, hasFB, hasTG, saveStatus: status})
```

---

## Required Output Format

After finishing ALL stores, produce this exact table:

```
SOCIAL LINKS UPDATE REPORT — Сырная Лавка
==========================================
Date: [today]
Total stores processed: 33

| Org ID        | Instagram | Facebook | Telegram | Save Status | Notes       |
|---------------|-----------|----------|----------|-------------|-------------|
| 2605231525    | ✅        | ✅       | ✅       | 200         | Already done|
| 46711213257   | ✅        | ✅       | ✅       | 200         |             |
| 51521899757   | ✅        | ✅       | ✅       | 200         |             |
| ...           | ...       | ...      | ...      | ...         |             |
| 242380255215  | ✅        | ✅       | ✅       | 200         |             |

SUMMARY:
- ✅ Success: X/33 stores
- ❌ Failed: X stores → [list org IDs]
- ⏭ Skipped (already had links): X stores

FAILED STORES (if any):
- [orgId]: [reason / HTTP status]
```

Use ✅ if confirmed present, ❌ if missing/failed, ❓ if uncertain.
