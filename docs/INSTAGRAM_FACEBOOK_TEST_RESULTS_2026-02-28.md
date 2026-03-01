# Instagram + Facebook Links — Test Results (Session 2)

**Date:** 2026-02-28 (Session 2)
**Store Tested:** 2605231525 (Сырная Лавка - Чилназарский район)
**Account:** Sanjar Sanjar (sismatullaev@gmail.com)

---

## ✅ WHAT WORKED

1. **JavaScript Method - Unhiding Fields:**
   - Instagram and Facebook input fields are **hidden by default** on the page
   - Class: `InfoUrls-InputWrapper_hidden`
   - Successfully removed "hidden" class via JavaScript
   - Fields became visible with labels and input boxes

2. **Filling the URLs:**
   - Successfully filled Instagram: `https://www.instagram.com/sirnayalavka.uz/`
   - Successfully filled Facebook: `https://www.facebook.com/sirnayalavka.uz/`
   - UI displayed all three links (Telegram + Instagram + Facebook)
   - Visual confirmation: All links showed on page with correct icons

3. **Clicking Save Button:**
   - "Сохранить изменения" button was successfully clicked
   - No error messages appeared
   - Page accepted the click and seemed to process the request

---

## ❌ WHAT DID NOT WORK

**The data did NOT persist to the backend database.**

**Evidence:**
- After page reload (F5), Instagram and Facebook links **disappeared**
- Returned to showing only Telegram: SirnayaLavka_Uzb
- Identical to previous session's failure

**Conclusion:** The method of unhiding hidden fields via JavaScript and filling them, while then saving, **does not actually persist the data**. The links were only displayed in the UI temporarily but were never saved to the database.

---

## 🔍 ROOT CAUSE ANALYSIS

**Hypothesis:** The hidden Instagram/Facebook fields are hidden because they're not part of the standard UI flow. The proper way to add social links requires:

1. **Option A:** Using the "Добавить" (Add) button to open a proper dialog or form where you can select which social network to add
2. **Option B:** Using a different API endpoint or method than the standard update-company endpoint
3. **Option C:** Using a different sequence of UI interactions that properly registers the change with React/the form system

**Evidence:**
- The fields are intentionally hidden (`InfoUrls-InputWrapper_hidden` class)
- Unhiding them doesn't trigger the same UI change tracking as using the "Добавить" button would
- The save request may be going through, but without the proper "fingerprint" or form tracking, it's not actually updating the backend

---

## 📋 NEXT STEPS TO TRY

### **Approach 1: Use the "Добавить" (Add) Button Properly** (RECOMMENDED)
1. Click the "Добавить" button in the "Сайт и социальные сети" section
2. Observe what dialog/form appears
3. Look for dropdown to select "Instagram"
4. Fill in the Instagram URL through the proper UI
5. Look for "+" or "Добавить еще" button to add Facebook
6. Fill in Facebook URL
7. Save changes

**Why this might work:** This follows the intended UI flow and would properly register changes with the form system.

### **Approach 2: Use the Telegram UI Pattern**
- The Telegram link was successfully added and persists
- Analyze how Telegram link is added (via "Добавить" button?)
- Replicate that exact process for Instagram and Facebook

### **Approach 3: API Investigation**
- Check network requests when adding Telegram link properly
- See if there's a different API endpoint for social links
- Or check if there's a specific header/parameter needed for Instagram/Facebook that Telegram doesn't need

---

## 📊 CURRENT STATUS

| Task | Status | Notes |
|------|--------|-------|
| **Understand problem** | ✅ COMPLETE | Hidden fields found, JavaScript method doesn't persist |
| **Test manual UI method** | ⏳ NEXT | Need to try using "Добавить" button properly |
| **Document working method** | ⏳ PENDING | Waiting for successful persistence |
| **Batch all 33 stores** | ⏳ BLOCKED | Depends on finding working method |

---

## 💾 FILES CREATED

- `docs/INSTAGRAM_FACEBOOK_TEST_RESULTS_2026-02-28.md` (this file)

---

## 🎯 RECOMMENDATION

**Do NOT use the JavaScript unhiding method.** It creates an illusion of success (links appear on page) but doesn't actually save the data.

**Instead:** Use the "Добавить" button and follow the intended UI flow. This is more likely to work because:
1. It will trigger proper React state management
2. It will include all necessary form tracking
3. It will use the correct fingerprint/CSRF tokens
4. It mirrors how Telegram (which works) is being added

---

**Session Duration:** ~30 minutes
**Key Learning:** Hidden UI elements are hidden for a reason - always use the intended UI flow
**Next Session:** Test the "Добавить" button method and verify persistence
