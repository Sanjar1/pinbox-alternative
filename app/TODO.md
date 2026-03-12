# TODO - Prioritized Tasks

## Next Steps (Complete These Now)

### Setup
- [ ] Run `npm run db:seed` to populate demo data
- [ ] Run `node scripts/extract-yandex-latlng.mjs` to generate CSV
- [ ] Import CSV via `/admin/stores/import` using "Create & Update" mode
- [ ] Verify all 33 stores show coordinates on `/admin/stores` page

## HIGH PRIORITY (Part of planned Tasks 1-7)

### Task 5: Add Retry Logic to Platform Sync
- [ ] Add retry helper function with exponential backoff (1s, 2s, 4s)
- [ ] Wrap each platform sync call in retry logic (max 3 attempts)
- [ ] Update `syncStatus` to FAILED if all retries exhausted
- [ ] Add retry count to error messages
- [ ] Test with intentional API failure

### Task 6: Add Admin Dashboard Stats
- [ ] Read current admin/page.tsx structure
- [ ] Add lat/lng coverage card (stores with coords / total)
- [ ] Add discovery ready card (stores with candidates / total)
- [ ] Add "Pending Lat/Lng" card with import link
- [ ] Show counts updating after bulk discovery

### Task 7: Browser Automation for Yandex Amenities
- [ ] Set up Claude in Chrome integration
- [ ] Create batch script to set amenities on all 33 stores
- [ ] Settings: парковка, велопаркова, Самовывоз, халал, фермерские продукты, Оплата картой, способ оплаты, акции, посещение с животными, доступность входа
- [ ] Verify amenities persist after reload (spot-check 3 stores)

## MEDIUM PRIORITY (Yandex Operations - Requires Browser)

### Instagram + Facebook Links (All 33 Stores)
- [ ] Test working method on one store (2605231525) - verify persistence
- [ ] Batch apply to remaining 32 stores
- [ ] Account for moderation delay (24-48h for public visibility)
- [ ] Verify links on Yandex Maps

### Ownership Claims (9 Representative Stores)
- [ ] If API access blocked, claim stores via SMS verification
- [ ] Store IDs: 46711213257, 68372174039, 73077844158, 80285992156, 88969661261, 93021421517, 96275437524, 134404129580, 225503578112
- [ ] SMS goes to: +998 93 549 67 67 or +998 97 711 15 15

## LOW PRIORITY (2GIS + External)

### 2GIS Tasks
- [ ] Remove test branch (branch_69a09623d9e3f) via 2GIS cabinet
- [ ] Create script to update phone (+998785551515) on 26 branches
- [ ] Create script to add business description to all branches

### External API Access
- [ ] Apply for Yandex Business API access
- [ ] Set up batch API updates instead of browser automation

## COMPLETED ✅

- [x] Task 1: CSV Import with lat/lng + update mode
- [x] Task 2: Extract lat/lng data for all 33 stores
- [x] Task 3: Fix encoding artifacts (code review completed)
- [x] Task 4: Build bulk discovery action

---

## Task Dependencies

```
Task 1,2 → Import lat/lng → Task 4 (bulk discovery) → Task 5,6,7
```

**Critical Path:**
1. Import lat/lng (enables discovery)
2. Run bulk discovery (populates candidates)
3. Task 5: Sync retry logic
4. Task 6: Dashboard stats
5. Task 7: Yandex amenities automation
