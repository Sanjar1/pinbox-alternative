# Complete Task Summary — What We Should Accomplish

**Project:** Сырная Лавка Multi-Platform Store Management
**Account:** Sanjar Sanjar (sismatullaev@gmail.com)
**Date:** 2026-03-01
**Status:** 4 tasks pending, dependencies identified

---

## 📊 TASK OVERVIEW

| # | Task | Priority | Status | Dependency | Est. Time |
|---|------|----------|--------|------------|-----------|
| 1 | Find working method for Instagram + Facebook | 🔴 HIGH | ⏳ PENDING | None | 15-30 min |
| 2 | Add Instagram + Facebook to all 33 stores | 🔴 HIGH | ⏳ BLOCKED | Task #1 | 30-45 min |
| 3 | Send RUBA support request | 🟡 MEDIUM | ⏳ PENDING | None | 5 min |
| 4 | Investigate API 404 errors | 🟡 MEDIUM | ⏳ PENDING | None | 30-60 min |

---

## 🎯 TASK #1 (HIGH PRIORITY): Find Working Method for Instagram + Facebook

**Status:** ⏳ PENDING
**Blocker:** YES (blocks Task #2)
**Timeline:** Next action

### What needs to be done:
1. Go to store 2605231525 edit page: https://yandex.ru/sprav/2605231525/p/edit/
2. Find "Сайт и социальные сети" (Website & Social Networks) section
3. Click the "Добавить" (Add) button
4. Observe what dialog/form appears
5. Follow the UI flow to add Instagram: https://www.instagram.com/sirnayalavka.uz/
6. Follow the UI flow to add Facebook: https://www.facebook.com/sirnayalavka.uz/
7. Save changes
8. **Reload page (F5) to verify links persist** ← CRITICAL TEST

### Success criteria:
- ✅ Links appear on page after adding
- ✅ Links persist after page reload
- ✅ Method is repeatable for batch processing

### Why this matters:
- Previous JavaScript method appeared to work but didn't persist
- Need to find the correct UI flow (same as Telegram, which does persist)
- This is the bottleneck for completing 33 stores

---

## 📝 TASK #2 (HIGH PRIORITY): Add Instagram + Facebook to All 33 Stores

**Status:** ⏳ BLOCKED (waiting for Task #1)
**Blocker:** NO (but depends on Task #1)
**Timeline:** 30-45 minutes after Task #1 confirmed

### What needs to be done:
1. Wait for Task #1 to confirm working method
2. Document the working method
3. Create batch processor using confirmed method
4. Process all 33 stores with Instagram + Facebook links:
   - Instagram: https://www.instagram.com/sirnayalavka.uz/
   - Facebook: https://www.facebook.com/sirnayalavka.uz/
5. Verify links appear in Yandex Business for all stores
6. Check Yandex Maps to see links (after 24-48 hour moderation)

### Expected outcome:
- ✅ All 33 Сырная Лавка stores with Instagram + Facebook links
- ✅ Links visible on https://maps.yandex.uz after moderation
- ✅ Links saved in store profiles

### Why this matters:
- Completes primary objective of adding social links
- Enables customer engagement through Instagram/Facebook
- Increases store discoverability

---

## 📧 TASK #3 (MEDIUM PRIORITY): Send RUBA Support Request

**Status:** ⏳ PENDING
**Blocker:** NO (independent task)
**Timeline:** 5 minutes (can be done anytime)

### What needs to be done:
1. Open: `docs/YANDEX_RUBA_SUPPORT_REQUEST_TEMPLATE.md`
2. Copy the support request (use Russian version)
3. Send to Yandex Business support
4. Include in email:
   - **To:** Yandex Business support (via sismatullaev@gmail.com account)
   - **Subject:** Создание трёх новых точек продаж RUBA
   - **Body:** Use template from file
5. Request: Create 3 RUBA stores + provide org IDs

### RUBA Stores to create:
1. **Урикзор** — Tashkent, Uchtepa district, Бурхониддин Маргинони 9
2. **Сергели оптом** — Tashkent, Sergeli district, мсг Фарогатли
3. **Бухара** — Bukhara city (coordinates 39.781670, 64.404903)

### Expected outcome:
- ⏳ 3-7 business days: Yandex responds with org IDs
- ✅ Can then create RUBA stores in 2GIS and Google Maps
- ✅ Expands product offering with new brand

### Why this matters:
- Creates brand presence for RUBA
- Enables 2GIS and Google Maps setup
- Unblocks creation of 3 additional store listings

---

## 🔍 TASK #4 (MEDIUM PRIORITY): Investigate API 404 Errors

**Status:** ⏳ PENDING
**Blocker:** NO (informational)
**Timeline:** 30-60 minutes research

### What to investigate:
1. **Problem:** Direct API calls return HTTP 404 for all 28 stores
2. **But:** Same stores are visible and editable in Yandex Business UI
3. **Find:** Why the discrepancy?

### Possible causes:
- Different API endpoint needed for certain operations
- Session/authentication scope limitations
- Store publication status affects API access
- API version or endpoint differences
- Batch operations need different parameters

### Investigation approach:
1. Review network requests when editing a store via UI
2. Check what API endpoint is actually used for updates
3. Compare with the endpoint used in batch calls
4. Look for missing headers, parameters, or authentication requirements
5. Test hypothesis with a single store API call

### Expected outcome:
- ✅ Identify correct API endpoint for batch operations
- ✅ Or confirm that batch operations require UI-based approach
- ✅ Information for future automation needs

### Why this matters:
- Determines if batch API automation is possible
- Could significantly speed up future updates
- Affects how we handle 2GIS and Google Maps batch operations

---

## 📈 PROJECT COMPLETION TIMELINE

### Phase 1: Find Working Method (Today)
- Task #1: Find Instagram + Facebook method → **15-30 minutes**
- Quick win before next phase

### Phase 2: Parallel Execution (1-2 days)
- Task #2: Batch all 33 stores → **30-45 minutes**
- Task #3: Send RUBA request → **5 minutes** (can do while waiting)
- Task #4: Investigate API → **30-60 minutes** (parallel work)

### Phase 3: Await External Response (3-7 business days)
- Waiting for Yandex RUBA support response with org IDs
- Can meanwhile:
  - Verify all 33 stores have Instagram + Facebook on Yandex Maps
  - Prepare 2GIS and Google Maps batch data
  - Document RUBA store creation process

### Phase 4: Complete Remaining Setup (1-2 days)
- Once RUBA org IDs received:
  - Create RUBA in 2GIS
  - Create RUBA in Google Maps
  - Upload RUBA logo
  - Verify all stores appear on all platforms

---

## ✅ SUCCESS DEFINITION

**Project is COMPLETE when:**

1. ✅ All 33 Сырная Лавка stores have Instagram + Facebook links
2. ✅ Links visible on Yandex Maps and verify page
3. ✅ RUBA support request sent (waiting for response)
4. ✅ API 404 issue understood and documented
5. ✅ All stores properly managed across Yandex Business, 2GIS, Google Maps

**Current Progress:** 0% (awaiting Task #1 completion)

---

## 📁 KEY FILES

**Ready to use:**
- `docs/YANDEX_RUBA_SUPPORT_REQUEST_TEMPLATE.md` — RUBA support request (ready to send)
- `docs/TASK_2_OWNERSHIP_CLAIMS_WORKFLOW.md` — SMS verification workflow (if needed)
- `docs/ACTION_PLAN_2026-02-28.md` — Updated action plan with test results

**Test results:**
- `docs/INSTAGRAM_FACEBOOK_TEST_RESULTS_2026-02-28.md` — Why JavaScript method failed

**API Reference:**
- `docs/YANDEX_API_CHEATSHEET.md` — API endpoints and code snippets

---

## 🚀 READY TO START?

**Recommended next action:**

→ **Task #1: Test the "Добавить" button method** (15-30 minutes)

This will unblock the remaining 3 tasks and let us complete the social links for all 33 stores.

---

**Project Created:** 2026-02-26
**Last Updated:** 2026-03-01
**Owner:** Sanjar Sanjar (sismatullaev@gmail.com)
