# Task 2: Ownership Claims on 9 Representative Stores — 2026-02-28

**Objective:** Claim ownership of 9 representative stores via Yandex Maps SMS verification

**Stores to Claim (9 total):**
```
46711213257, 68372174039, 73077844158, 80285992156, 88969661261,
93021421517, 96275437524, 134404129580, 225503578112
```

**Expected Outcome:** Stores become "owned" → Full API access → Can add Instagram + Facebook links

**SMS Verification Numbers:**
- Primary: +998 93 549 67 67 (added to all stores)
- Secondary: +998 97 711 15 15 (already on listings)

---

## Workflow: Claim Ownership via Yandex Maps

### Step-by-Step Process

**For Each of the 9 Stores:**

1. **Go to Yandex Maps**
   - URL: https://maps.yandex.uz
   - Search for store name (or use direct store link if available)

2. **Click "Я владелец" (I'm the owner)**
   - Look for ownership claim button on store profile
   - Or go to: https://yandex.ru/sprav/{storeId}

3. **Verify Ownership via SMS**
   - Yandex will send SMS to one of:
     - +998 93 549 67 67 (primary - added to all stores)
     - +998 97 711 15 15 (secondary - already on listings)
   - Enter SMS code when prompted

4. **Confirm Ownership**
   - Complete any additional verification
   - Store becomes "owned" in your account

5. **Wait ~15 minutes**
   - System updates propagate
   - Store now fully accessible in Yandex Business

---

## Store Details for Lookup

| # | Store ID | Name (Typical) | Location |
|---|----------|---|----------|
| 1 | 46711213257 | Лавка [...] | Ташкент |
| 2 | 68372174039 | Лавка [...] | Ташкent |
| 3 | 73077844158 | Лавка [...] | Ташkent |
| 4 | 80285992156 | Лавка [...] | Ташkent |
| 5 | 88969661261 | Лавка [...] | Ташkent |
| 6 | 93021421517 | Лавка [...] | Ташkent |
| 7 | 96275437524 | Лавка [...] | Ташkent |
| 8 | 134404129580 | Лавка [...] | Ташkent |
| 9 | 225503578112 | Лавка [...] | Ташkent |

**Note:** See data/stores_audit.xlsx for exact store names and addresses

---

## Quick Claim Links

**Direct claim links (use these to speed up the process):**

```
https://yandex.ru/sprav/46711213257
https://yandex.ru/sprav/68372174039
https://yandex.ru/sprav/73077844158
https://yandex.ru/sprav/80285992156
https://yandex.ru/sprav/88969661261
https://yandex.ru/sprav/93021421517
https://yandex.ru/sprav/96275437524
https://yandex.ru/sprav/134404129580
https://yandex.ru/sprav/225503578112
```

On each page, look for "Я владелец" (I'm the owner) button.

---

## SMS Verification Checklist

**Before Starting:**
- [ ] Ensure +998 93 549 67 67 is accessible to receive SMS
- [ ] OR ensure +998 97 711 15 15 is accessible
- [ ] Have your phone ready to receive SMS codes

**During Verification:**
- [ ] Click "Я владелец" on each store
- [ ] Choose phone number for SMS (919-549-67-67 or 997-711-15-15)
- [ ] Receive SMS code
- [ ] Enter code when prompted
- [ ] Confirm ownership

**After Verification:**
- [ ] Wait 15 minutes for system to update
- [ ] Store should now be "owned" status
- [ ] Can now add Instagram + Facebook links

---

## Success Criteria

**Store Claim Successful When:**
- ✅ Yandex shows "Владелец" (Owner) status instead of "Представитель" (Representative)
- ✅ Store accessible in https://yandex.ru/sprav/companies
- ✅ Full edit access in Yandex Business

**Verify by:**
1. Go to store in Yandex Business
2. Check status: should show "Owned" or similar
3. Verify edit permissions are available
4. Confirm phone number is now linked

---

## Estimated Timeline

- **Per store:** 2-3 minutes (SMS code delay)
- **Total for 9 stores:** 20-30 minutes
- **System propagation:** 10-15 minutes after last claim
- **Ready for batch Instagram/Facebook:** 45-50 minutes total

---

## After Claims Complete

Once all 9 stores are owned:

1. **Verify in Yandex Business**
   - Go to https://yandex.ru/sprav/companies
   - Should now see 24 + 9 = 33 stores total

2. **Retry Instagram + Facebook Batch**
   - Run batch processor on all 26 newly-accessible representative stores
   - Expected success: ~24+ additional stores (all now owned)

3. **Update Excel**
   - Mark 9 stores as "owned" in data/stores_audit.xlsx
   - Document completion date

4. **Verify on Maps**
   - Search stores on https://maps.yandex.uz
   - Confirm Instagram + Facebook appear (after moderation, 24-48 hours)

---

## Expected Result

| Stage | Count | Notes |
|-------|-------|-------|
| **Before Claims** | 2/28 | Only fully-owned stores accessible |
| **After Claims** | 26/28 | 9 representative stores + 26 originally inaccessible become owned |
| **Representative Stores Still No Access** | 2 | May require additional setup |
| **Final Expected** | ~26-27/28 | Most stores successfully updated |

---

## Notes

- Store phone numbers (919-549-67-67, 997-711-15-15) must be able to receive SMS
- SMS codes typically valid for 10 minutes
- If SMS doesn't arrive, try secondary number
- Claims can be done one at a time or in batches (refresh between each)

**Ready to proceed?** Click "Я владелец" on each store in order.

---

**Files Referenced:**
- `data/stores_audit.xlsx` — Store names and details
- `docs/MEMORY.md` — Store ID list and phone numbers
