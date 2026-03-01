# Batch Reply Guide — Yandex Negative Reviews

## Quick Start

You want to: **Reply to all 1-3★ reviews (2025-2026) on Yandex Business**

### Option 1: Playwright Script (Fastest)
**Requires:** Node.js, Playwright (`npm install playwright`)

```bash
cd app/scripts
node batch-reply-negative-yandex.mjs --dry-run     # Preview only
node batch-reply-negative-yandex.mjs               # Execute replies
```

**Output:** `data/yandex_negative_reply_report_latest.json` with stats

**Flags:**
- `--dry-run` — Show what would be replied without posting
- No flags — Actually post replies (requires Yandex login in browser)

---

### Option 2: Chrome Extension (Browser-based)

**Works from:** Claude-in-Chrome tool in Claude Code

**Steps:**
1. Copy the JS function from `docs/YANDEX_API_CHEATSHEET.md` section 5
2. For each store:
   ```
   a) mcp__claude-in-chrome__navigate to https://yandex.ru/sprav/{orgId}/p/edit/reviews/
   b) mcp__claude-in-chrome__javascript_tool (paste function)
   c) Check result: {sent: [...], skipped: N}
   ```
3. Move to next store

**All 33 org IDs:** See `YANDEX_API_CHEATSHEET.md` section at bottom

---

## What Gets Replied To?

✅ **YES** — Reply to these:
- Star rating: 1, 2, or 3 stars (value_2, value_4, value_6)
- Status: Unanswered (has `<textarea>` in DOM)
- Date: 2025 or 2026
- Already filtered for dates outside this range

❌ **NO** — Skip these:
- 4-5 stars (only handle negative/low feedback)
- Already answered (no textarea visible)
- Reviews from 2024 or earlier, 2027+
- "No reviews" pages (detected automatically)

---

## Reply Template

**Structure:** Context-aware negative response

```
{Author}, добрый день!
Сожалеем, что визит оставил негативное впечатление.
Мы обязательно разберём {issue detected}.
Пожалуйста, свяжитесь: Telegram @SirnayaLavka_Uzb или +998 78 555 15 15.
Надеемся на понимание и будем рады видеть вас снова!
```

**Issue detection** (auto-populated from review text):
- "кассир/телефон/груб" → "поведение сотрудника"
- "просроч/качеств" → "качество товара"
- "цен/дорог" → "ценовую политику"
- "час/закрыт" → "режим работы"
- (default) → "произошедшую ситуацию"

---

## Technical Details

### DOM Structure
```
.Review                                    ← Review card
├─ .Review-UserName                       ← Author
├─ .Review-RatingDate
│  ├─ [class*="StarsRating_value_N"]     ← Stars (N/2 = count)
│  └─ .Review-Date                        ← Date text
├─ .Review-Text                           ← Review content
├─ textarea                               ← Reply field (if unanswered)
└─ button.ya-business-yabs-button         ← Submit (enabled after text)
```

**Stars class format:**
- `StarsRating_value_2` = 1 star
- `StarsRating_value_4` = 2 stars
- `StarsRating_value_6` = 3 stars
- `StarsRating_value_8` = 4 stars
- `StarsRating_value_10` = 5 stars

### React Textarea Trick

**Why:** React controls textarea value internally. Plain `.value =` doesn't trigger events.

**How:**
```js
const setter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype, 'value'
).set;
setter.call(textarea, text);
textarea.dispatchEvent(new Event('input', { bubbles: true }));
textarea.dispatchEvent(new Event('change', { bubbles: true }));
```

This is **required** for React-controlled inputs.

---

## Common Issues

| Problem | Solution |
|---------|----------|
| Button not enabled after typing | Check React textarea trick — plain `.fill()` won't work |
| "Not authenticated" error | Log in to Yandex in the browser window, then retry |
| Review page shows "No reviews" | Store may not have reviews; script skips gracefully |
| Can't find star rating | Check if card class has `StarsRating_value_*` — some edge cases may differ |
| Script runs but sends nothing | Filter caught all reviews (probably 4-5★ or not 2025-2026) |
| Submit fails silently | Check if button selector found — may have changed layout |

---

## Status (as of 2026-02-28)

**Completed manually:**
- Store 119087534313 (★3.6): 1 reply sent
- Store 80285992156 (★3.9): 1 reply sent
- Store 113993963061 (★4.3): 1 reply sent

**Scanned (no negative reviews found):**
- Stores 119523779091, 225833833825, 143672341206, 68372174039, 133701096811

**Remaining:** 23 other org IDs (mix of accessible + representative stores)

---

## Files

- **Script:** `scripts/batch-reply-negative-yandex.mjs` (Playwright)
- **JS Function:** `docs/YANDEX_API_CHEATSHEET.md` section 5 (Chrome extension)
- **DOM Guide:** `docs/YANDEX_API_CHEATSHEET.md` section 5 (detailed structure)
- **API Reference:** `docs/YANDEX_API_CHEATSHEET.md` (all endpoints)
- **Session log:** `docs/SESSION_2026-02-28.md` (what was done today)
- **Memory:** `memory/MEMORY.md` (project state)

---

## Next Steps

After reviews are done:
1. **Task 1:** Add Instagram + Facebook links (GEMINI_PROMPT.md)
2. **Task 2:** Ownership claims on 9 representative stores
3. **Task 3:** Configure new stores (rows 29-35 in Excel)
