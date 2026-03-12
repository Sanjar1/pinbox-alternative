# Specifications & Requirements

## Project Goal

Enable multi-store businesses (specifically "Сырная Лавка" - a 33-store cheese shop chain) to manage their profiles across Yandex Business Profiles, Google Business Profiles, and 2GIS, while collecting and responding to customer feedback via QR codes.

**Primary Focus:** Yandex-first approach (aligns with market in Uzbekistan)

## Functional Requirements

### Authentication & Authorization
- [FR-1.1] Users can register with email and password
- [FR-1.2] Users can login with email/password
- [FR-1.3] System maintains server-side sessions (no JWT)
- [FR-1.4] Passwords are hashed with bcrypt
- [FR-1.5] Multi-tenant isolation - users only see their tenant's stores
- [FR-1.6] Role-based access: OWNER can manage all, STORE_MANAGER assigned stores only

### Store Management
- [FR-2.1] Owners can create stores manually
- [FR-2.2] Owners can bulk import stores from CSV
- [FR-2.3] CSV import supports lat/lng columns for coordinates
- [FR-2.4] CSV import can update existing stores (upsert by name)
- [FR-2.5] Store details include: name, address, phone, hours, description
- [FR-2.6] Stores display master profile with lat/lng
- [FR-2.7] Stores can be linked to platform profiles (Google, Yandex, 2GIS)

### Discovery System
- [FR-3.1] Users can trigger discovery to find stores on platforms
- [FR-3.2] Discovery uses store name, address, lat/lng to search platforms
- [FR-3.3] Discovery shows candidate matches with confidence scores
- [FR-3.4] Users can link a store to a discovered candidate
- [FR-3.5] Bulk discovery action runs discovery on all stores with lat/lng
- [FR-3.6] Bulk discovery skips stores without coordinates

### Platform Connectivity
- [FR-4.1] System can read data from Google Business Profiles (via API)
- [FR-4.2] System can read data from Yandex (ready for real API)
- [FR-4.3] System can read data from 2GIS (ready for real API)
- [FR-4.4] System can update store data on Google (via API)
- [FR-4.5] System shows sync status: DISCONNECTED, SYNCED, OUT_OF_SYNC, FAILED
- [FR-4.6] System has connector interface for easy platform additions

### QR Feedback Collection
- [FR-5.1] System generates unique QR codes per store
- [FR-5.2] Public page accepts customer feedback (rating + comment)
- [FR-5.3] Feedback submissions show confirmation
- [FR-5.4] Feedback stored in database with timestamp
- [FR-5.5] Admin can view all feedback per store
- [FR-5.6] Feedback has status: NEW, RESOLVED, ARCHIVED

### Notifications
- [FR-6.1] New feedback triggers optional Telegram notification
- [FR-6.2] New feedback triggers optional email notification (Resend)
- [FR-6.3] Notifications configurable via environment variables
- [FR-6.4] Notification delivery is non-blocking (doesn't break feedback submission)

### Audit & Compliance
- [FR-7.1] All admin actions logged to AuditLog table
- [FR-7.2] Logs include: action type, user ID, timestamp, details
- [FR-7.3] Users cannot delete their own audit logs
- [FR-7.4] Admin can view audit logs for compliance

## Non-Functional Requirements

### Performance
- CSV import: <5 seconds for 100 stores
- Discovery per store: <3 seconds average (depends on API latency)
- Page load: <2 seconds (including database queries)
- Bulk discovery for 33 stores: <2 minutes (sequential)

### Scalability
- Support 1-1000 stores per tenant
- Support 1-100 users per tenant
- Support multiple tenants
- Database can handle 100k+ records

### Reliability
- 99% uptime target
- Graceful error handling (no 500 errors without logging)
- Retry logic for failed API calls
- Database backups automated

### Security
- Passwords never logged or exposed
- API keys in environment variables only
- CSRF protection on forms
- Tenant isolation enforced on all queries
- No PII in error messages sent to client
- Rate limiting on login attempts

### Usability
- Responsive design (desktop + mobile)
- Clear error messages
- Confirmation dialogs for destructive actions
- Progress indicators for long operations
- Keyboard navigation support

### Accessibility
- WCAG 2.1 Level A compliance target
- Semantic HTML
- Color not sole indicator of information
- Alt text for images

### Data Protection
- User consent for data processing
- GDPR-ready (can be added as requirement)
- Data retention policies configurable
- Export user data capability (future)

## User Stories

### Store Manager
- As a store manager, I want to view my assigned store's feedback so that I can respond to customers
- As a store manager, I want to see how many people scanned my QR code so that I know engagement

### Store Owner
- As a store owner, I want to bulk import all my store locations so that I don't enter them manually
- As a store owner, I want to link my stores to Yandex profiles so that they appear in Yandex Maps
- As a store owner, I want to run discovery across all stores so that I can find and link existing profiles
- As a store owner, I want to update store hours across platforms so that customers always have correct info

### System Administrator
- As an admin, I want to see audit logs so that I can track what users changed
- As an admin, I want to manage users and roles so that permissions are correct
- As an admin, I want to configure notifications so that alerts reach the right channel

## Acceptance Criteria

### Story: Bulk Import Stores
- [AC-1] User can upload CSV with 100+ stores
- [AC-2] System validates each row and shows errors
- [AC-3] On error, import stops and shows which rows failed
- [AC-4] On success, all stores are created in database
- [AC-5] User can update existing stores by using "Create & Update" mode
- [AC-6] Lat/lng values are parsed as floats and stored correctly

### Story: Run Discovery for All
- [AC-1] Button appears only if stores have lat/lng
- [AC-2] Button shows loading state while running
- [AC-3] On completion, shows count of processed/failed stores
- [AC-4] Candidates populated in database for each store
- [AC-5] User can immediately link candidates without refresh

### Story: Link Store to Platform
- [AC-1] User sees list of candidates from all platforms
- [AC-2] Confidence score displayed (0-100%)
- [AC-3] "Link This" button creates connection in database
- [AC-4] After linking, other candidates for that platform are marked rejected
- [AC-5] Platform link shows as CONNECTED in store view

## Out of Scope

### Phase 1 (Current)
- ❌ Automated sync from platforms to app (discovery only, no sync-back)
- ❌ Real Yandex Business API integration (mock only)
- ❌ Real 2GIS API integration (mock only)
- ❌ Social media integration (Instagram, Facebook feeds)
- ❌ Photo uploads/management
- ❌ Inventory management
- ❌ Customer database/CRM
- ❌ Advanced analytics/reporting
- ❌ Mobile app (web only)
- ❌ HIPAA/GDPR compliance (basic privacy only)
- ❌ Advanced search/filtering

### Future Phases
- Phase 2: Real Yandex API integration
- Phase 3: Real 2GIS API integration
- Phase 4: Two-way sync (app → platforms)
- Phase 5: Advanced reporting and analytics
- Phase 6: Mobile app
- Phase 7: Multi-language support

## Configuration

### Required Environment Variables
```env
DATABASE_URL=          # SQLite: file:./dev.db or Postgres connection string
DISABLE_AUTH_FOR_TESTING=true|false
```

### Optional Environment Variables
```env
GOOGLE_BP_CLIENT_ID=
GOOGLE_BP_CLIENT_SECRET=
GOOGLE_BP_REFRESH_TOKEN=
GOOGLE_REDIRECT_URI=

TELEGRAM_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
ALERT_EMAIL_TO=

IMPORT_OWNER_EMAIL=
```

## Success Metrics

- ✅ 33 stores imported with lat/lng
- ✅ Discovery runs without errors on all stores
- ✅ 90%+ candidates correctly matched
- ✅ Page load times <2 seconds
- ✅ Zero unhandled errors in production
- ✅ 100% audit logging of admin actions
- ✅ User feedback collected successfully
