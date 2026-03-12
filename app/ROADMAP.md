# Roadmap

## Current Milestone: Phase 1 - Discovery & Linking (In Progress)

**Target:** 2026-03-15
**Status:** 4/7 tasks complete

### Phase 1 Goals
- [x] Task 1: CSV import with lat/lng support and update mode
- [x] Task 2: Extract lat/lng data for all 33 Сырная Лавка stores
- [x] Task 3: Fix encoding artifacts (verified working correctly)
- [x] Task 4: Bulk discovery action
- [ ] Task 5: Add retry logic to platform sync
- [ ] Task 6: Add admin dashboard stats (lat/lng + discovery coverage)
- [ ] Task 7: Browser automation for Yandex amenities

### Completion Criteria
- All 33 stores have lat/lng
- Discovery runs without errors
- Can bulk discover all stores in <2 minutes
- Admin dashboard shows coverage stats
- Yandex amenities set on all 33 stores

---

## Phase 2 - Real Yandex Integration (Planned: Q2 2026)

**Duration:** 4-6 weeks
**Priority:** High (primary platform for Uzbekistan market)

### Phase 2 Goals
- [ ] Claim 9 representative stores via SMS verification
- [ ] Apply for Yandex Business API access
- [ ] Implement real Yandex connector (replace mock)
- [ ] Two-way sync: app → Yandex
- [ ] Set business description on all stores
- [ ] Add Instagram + Facebook links to all stores
- [ ] Batch set amenities via API (instead of browser)
- [ ] Test with 3-5 stores before full rollout

### Deliverables
- Real Yandex connector class
- API documentation for Yandex integration
- Batch operation scripts
- Updated admin UI showing Yandex sync status

---

## Phase 3 - 2GIS Integration (Planned: Q2 2026)

**Duration:** 2-3 weeks
**Priority:** Medium

### Phase 3 Goals
- [ ] Implement real 2GIS API connector (replace mock)
- [ ] Remove test branch from 2GIS cabinet
- [ ] Fix phone number on all 26 2GIS branches
- [ ] Add business description to all 2GIS branches
- [ ] Two-way sync for 2GIS
- [ ] Test with sample stores

### Deliverables
- Real 2GIS connector class
- 2GIS batch update scripts
- UI for 2GIS sync status

---

## Phase 4 - Reporting & Analytics (Planned: Q3 2026)

**Duration:** 3-4 weeks
**Priority:** Medium

### Phase 4 Goals
- [ ] Customer feedback analytics
- [ ] Discovery performance metrics
- [ ] Platform sync status reports
- [ ] Store comparison dashboard
- [ ] Exportable reports (CSV/PDF)
- [ ] Email reports (daily/weekly)

### Deliverables
- Analytics dashboard
- Report generation system
- Email scheduling

---

## Phase 5 - Mobile App (Planned: Q3-Q4 2026)

**Duration:** 8-12 weeks
**Priority:** Low (web first)

### Phase 5 Goals
- [ ] React Native or Flutter app
- [ ] Store locator with map
- [ ] Offline feedback collection
- [ ] Push notifications

---

## Phase 6 - Advanced Features (Planned: 2027)

- Multi-language support (Russian, Uzbek, English)
- Advanced permission management
- Custom workflows
- API for integrations
- Webhook support

---

## Completed Milestones

### Phase 0 - MVP Foundation (Completed 2026-02-28)
- ✅ Next.js setup with App Router
- ✅ Prisma database schema
- ✅ User authentication (session-based)
- ✅ Multi-tenant architecture
- ✅ Store CRUD operations
- ✅ QR code generation
- ✅ Feedback collection
- ✅ Google Business Profile connector (real)
- ✅ CSV import basic functionality
- ✅ Yandex mock connector
- ✅ 2GIS mock connector
- ✅ Discovery system foundation

---

## Timeline Summary

```
Q1 2026
├─ Week 1-2: Phase 1 completion (Tasks 5-7)
├─ Week 3-4: Phase 1 testing & verification
│
Q2 2026
├─ Week 1-3: Phase 2 (Yandex real API)
├─ Week 3-4: Phase 3 (2GIS real API)
│
Q3 2026
├─ Week 1-3: Phase 4 (Reporting)
├─ Week 4-8: Phase 5 (Mobile)
│
Q4 2026
├─ Q4: Phase 5 continuation + stabilization
│
2027
└─ Phase 6 (Advanced features)
```

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Yandex API access denial | High | Apply early, use support contacts |
| 2GIS API rate limits | Medium | Batch operations, retry logic |
| Database scalability | Low | Switch to Postgres for production |
| Team capacity | Medium | Break tasks into smaller chunks |
| Encoding issues (Cyrillic) | Low | Already tested and working |

---

## Success Metrics (Phase 1)

- [ ] All 33 stores have lat/lng coordinates
- [ ] Discovery succeeds on all 33 stores
- [ ] 90%+ candidate matches are correct
- [ ] Yandex amenities set on all 33 stores
- [ ] Zero unhandled errors during operations
- [ ] Build passes linting and type-checking
- [ ] Production build <200KB gzipped

---

## Decision Points

### Should we invest in real Yandex API early?
**Current approach:** Mock connector now, real API in Phase 2
**Rationale:** Get MVP out faster, validate architecture before heavy API integration
**Revisit:** If API access becomes bottleneck

### Mobile app priority?
**Current approach:** Web-first (Phase 5)
**Rationale:** Web covers 80% of use cases, mobile comes later
**Revisit:** If mobile traffic becomes significant

### Two-way sync immediately?
**Current approach:** Discovery first (one-way read), sync later
**Rationale:** Safer, allows manual review before platform updates
**Revisit:** Once we have high confidence in candidate matching

---

## Dependencies for Phase 1 Completion

- [ ] Yandex org IDs for all 33 stores (documented in YANDEX_API_CHEATSHEET.md)
- [ ] Lat/lng data extraction (script written)
- [ ] CSV import tested with real data
- [ ] Browser automation tools available for Yandex

---

## Contact & Escalation

**Phase 1 Owner:** [Development Team]
**Yandex Integration:** Requires API access application + SMS verification
**2GIS Integration:** Requires cabinet access + API credentials
**Questions:** Check docs/YANDEX_API_CHEATSHEET.md for technical details
