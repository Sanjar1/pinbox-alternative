# UPDATED ACTION PLAN — 2026-02-28 Session 2

**Status:** Corrected ownership understanding. Ready for Instagram + Facebook testing.

---

## ✅ VERIFIED FACTS

**From https://yandex.ru/sprav/companies:**
- ✅ You own **ALL 33 stores** (Sanjar Sanjar account)
- ✅ All 33 are listed and visible
- ✅ All 33 show "Обновить данные" (Update data) option
- ✅ All 33 have status "Работает" (Working)

**Previous false assumption:** "26 stores are representative" ← **INCORRECT**

---

## 🔍 ISSUE IDENTIFIED (NOT RESOLVED)

**Problem:** Direct API batch returned HTTP 404 on 26 stores, despite them being visible and editable in UI.

**Root cause:** Unknown - requires investigation. Possible causes:
- API endpoint access issue
- Session/authentication problem
- Store publication status
- API version mismatch
- Other technical limitation

**This is NOT an ownership issue** - you own all 33.

---

## 📋 CORRECT TASK SEQUENCE

### **PRIORITY 1: TEST Instagram + Facebook Method — FINDINGS**

**Status:** 🔴 TEST FAILED - JavaScript unhiding method doesn't persist data

**What we discovered:**
1. ✅ Instagram/Facebook input fields exist but are **hidden by default**
2. ✅ JavaScript can unhide them and fill with URLs
3. ✅ Links display correctly in UI after filling
4. ❌ **Data does NOT persist after page reload** (same as previous session)
5. ❌ Links disappear when page reloads - never saved to backend

**Why it failed:**
- Unhiding hidden fields bypasses React's form tracking
- The form doesn't recognize changes to hidden fields
- The save request may go through but without proper form state tracking, it doesn't update the backend

**Next approach to test:**
- Use the "Добавить" (Add) button in the "Сайт и социальные сети" section
- This should open a proper dialog to add links through the intended UI flow
- Follow the same pattern used for Telegram (which successfully persists)

---

### **PRIORITY 2: Apply Working Method to All 33 Stores**

**Once method is confirmed:**
1. Use proper batch processor with verified method
2. Process all 33 stores (not just 28)
3. Verify links are saved on Yandex Maps

**Expected timeline:** 30-45 minutes for all 33 stores

---

### **PRIORITY 3: RUBA Support Request (Can be done anytime)**

**Status:** ✅ Ready to send

**File:** `docs/YANDEX_RUBA_SUPPORT_REQUEST_TEMPLATE.md`

**Timeline:** 3-7 business days for Yandex response with org IDs

---

## 🚀 IMMEDIATE NEXT STEPS

### RIGHT NOW:
1. ✅ Ownership confirmed - you own all 33 stores
2. ⏳ **Test Instagram + Facebook on ONE store** (store 2605231525)
3. ⏳ Verify the method works and links persist

### AFTER VERIFICATION:
1. Apply method to all 33 stores via batch processor
2. Send RUBA support request (email template ready)
3. Verify all links appear on Yandex Maps (24-48 hours for moderation)

---

## 📊 EXPECTED FINAL STATE

| Item | Count | Status |
|------|-------|--------|
| **Сырная Лавка stores** | 33 | To be updated with Instagram + Facebook |
| **RUBA stores** | 3 | Waiting on support response with org IDs |
| **Total** | 36+ | Fully managed |

---

## 📁 FILES TO UPDATE/CREATE

**To Create:**
- `docs/INSTAGRAM_FACEBOOK_WORKING_METHOD_2026-02-28.md` — Document which method actually works

**To Archive (incorrect assumptions):**
- `docs/ACTION_PLAN_2026-02-28.md` (old version with false assumptions)
- `docs/TASK_2_OWNERSHIP_CLAIMS_WORKFLOW.md` (no longer needed)

**Still Valid:**
- `docs/YANDEX_RUBA_SUPPORT_REQUEST_TEMPLATE.md` — Ready to send
- `docs/YANDEX_API_CHEATSHEET.md` — API reference

---

**Document Updated:** 2026-02-28 Session 2
**Account:** Sanjar Sanjar (sismatullaev@gmail.com) — Owner of all 33 stores
**Project:** Сырная Лавка Multi-Platform Management
