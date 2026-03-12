# Architecture

## Overview

Pinbox Alternative is a multi-tenant store profile management system focused on Yandex Business Profiles, with support for Google Business Profiles and 2GIS.

**Core Purpose:** Aggregate store profiles across platforms, collect customer feedback via QR codes, and synchronize information across multiple business directories.

## System Components

### 1. Frontend (React + Next.js App Router)
- **Pages:**
  - Public: `[slug]` - QR feedback form
  - Auth: `/login` - User login
  - Admin: `/admin` - Dashboard, stores management
  - Admin: `/admin/stores/[id]` - Store details + location linking
  - Admin: `/admin/stores/[id]/discovery` - Candidate matching UI
  - Admin: `/admin/stores/import` - Batch CSV import

- **Architecture:**
  - Server components for data fetching and auth
  - Client components for interactive features (forms, buttons, state)
  - TailwindCSS for styling
  - No external UI library (custom components)

### 2. Backend (Next.js Server Actions + Prisma)
- **Key Server Actions:**
  - `importStores()` - Bulk CSV import with lat/lng support
  - `triggerDiscovery()` - Find candidates on platforms
  - `acceptCandidate()` - Link store to discovered location
  - `syncStoreToPlatforms()` - Update store data on platforms
  - `runDiscoveryForAllStores()` - Bulk discovery across all stores

- **Database:**
  - SQLite (development)
  - Postgres-compatible schema for production
  - Managed by Prisma ORM

### 3. Platform Connectors
Each platform has a connector implementing the `IConnector` interface:

```typescript
interface IConnector {
  getCapabilities(): CapabilityMatrix;
  search(lat, lng, name, phone?): Promise<LocationCandidate[]>;
  getLocation(externalId): Promise<StoreSyncData>;
  createLocation(data): Promise<{externalId, url, status}>;
  updateLocation(externalId, data): Promise<{status, changes}>;
}
```

**Implemented Connectors:**
- **Google (Real):** `impl/google-real.ts` - Live API integration via OAuth2
- **Yandex (Mock):** `yandex.ts` - Mock returning realistic Cyrillic data
- **2GIS (Mock):** `twogis.ts` - Mock returning realistic data

### 4. Discovery Engine
Located in `src/lib/discovery.ts`:
- Iterates all connectors
- Calls `.search(lat, lng, name, phone)`
- Stores results as `MatchCandidate` records
- Clears old pending candidates before each run

**Key Logic:**
```
For each platform:
  1. Call connector.search()
  2. Delete old pending candidates
  3. Create new candidate records with confidence score
  4. Store raw API response in matchData (JSON)
```

### 5. Multi-Tenancy & Auth
- **Session-based:** Server-side sessions in `Session` table
- **Tenant Isolation:** All queries filter by `tenantId`
- **Role-Based:** OWNER vs STORE_MANAGER roles
- **Auth Check:** `requireCurrentUser()` on every protected route

**Key Functions:**
- `storeWhereForUser(user)` - Generates Prisma where clause for user's stores
- `requireOwner()` - Throws if not OWNER role
- `requireCurrentUser()` - Returns current user or throws

## Data Flow

### Store Import Flow
```
CSV File
  ↓
[parseCsv] → validate each row
  ↓
[normalizeRow] → parse floats, trim strings
  ↓
[importStores] → for each row:
  - If "create-only": create new store + master profile + location links
  - If "create-and-update": find by name, upsert master profile with new lat/lng
  ↓
Database (Store, StoreMasterProfile, PlatformLocationLink)
```

### Discovery Flow
```
Store (with lat/lng from master profile)
  ↓
[runDiscoveryForStore]
  ↓
For each connector (Google, Yandex, 2GIS):
  [connector.search(lat, lng, name, phone)]
  ↓
API responses (LocationCandidate[])
  ↓
[Create MatchCandidate records]
  ↓
Database (MatchCandidate)
  ↓
UI shows candidates with confidence scores
```

### Candidate Linking Flow
```
User clicks "Link This" on a candidate
  ↓
[acceptCandidate(storeId, candidateId)]
  ↓
[Create/Upsert PlatformLocationLink]
  - Extract matchData.url from candidate
  - Set externalId and platform
  - Mark status = CONNECTED
  ↓
[Reject other pending candidates for same platform]
  ↓
Database updated
  ↓
UI refreshes
```

## Database Schema

### Key Tables

**Store** - Physical location
- id, name, address, tenantId, qrCodes[], masterProfile, locationLinks, matchCandidates

**StoreMasterProfile** - Unified data for all platforms
- id, storeId, name, address, lat, lng, phone, hours, description, website, photos

**PlatformLocationLink** - Bridge to external profiles
- id, storeId, platform (GOOGLE/YANDEX/TWOGIS), externalId, url, syncStatus, capabilityLevel

**MatchCandidate** - Discovery results
- id, storeId, platform, externalId, name, address, lat, lng, distanceMeters, score, matchData (JSON), status

**QRCode** - Customer feedback entry point
- id, name, slug, storeId, scans

**Feedback** - Customer feedback submission
- id, rating, comment, contact, storeId, status

**AuditLog** - Track all changes
- id, action, details, tenantId, userId, createdAt

## Key Design Decisions

### 1. Master Profile Pattern
Single source of truth for store data across all platforms:
- Reduce data inconsistency
- Easier sync (one profile → multiple platforms)
- Simplifies conflict resolution

### 2. Candidate-Based Linking
Instead of auto-linking:
- Show human-verified matches first
- Confidence scoring prevents false positives
- Users approve before sync

### 3. Connector Interface
Abstraction layer for platforms:
- Easy to add new platforms
- Mock connectors for testing
- Capability matrix (what each platform can do)

### 4. Lazy Discovery
Discovery runs on-demand, not on import:
- Avoids rate limits on initial import
- User controls when searches happen
- Bulk action available for efficiency

### 5. Server Actions > API Routes
Use Next.js server actions for:
- Simpler code (no routing, no middleware)
- Built-in serialization
- Type-safe client-server communication

## External Dependencies

### APIs
- **Google Business Profile API** - Search, read, update locations
- **Yandex Sprav API** - Read store data (real implementation pending)
- **2GIS API** - Read store data (integration pending)

### Services
- **Telegram** - Optional feedback notifications (webhook)
- **Resend** - Optional email notifications
- **Anthropic Claude** - Browser automation for manual tasks

### Libraries
- **Next.js** - Framework
- **Prisma** - ORM
- **React** - UI library
- **TailwindCSS** - Styling

## Security Considerations

### Authentication
- Passwords hashed with bcrypt (salt rounds: 12)
- Sessions server-side (not JWT)
- Session tokens rotated on login

### Authorization
- Tenant isolation on all queries
- Role-based access (OWNER, STORE_MANAGER)
- Verify store ownership before mutations

### Data Protection
- No PII in logs (except for audit trail)
- API keys in environment variables only
- CSRF protection (built into Next.js forms)

### Input Validation
- CSV parsing strict (fails on bad data)
- URL validation for platform links
- Coordinate range validation (lat -90..90, lng -180..180)

## Performance Optimizations

### Database
- Indexes on frequently queried fields (tenantId, storeId, platform)
- Bulk operations (deleteMany, updateMany) for efficiency
- Prisma caching for session lookups

### Frontend
- Server components reduce JavaScript payload
- Incremental static regeneration for public pages
- TailwindCSS purging for minimal CSS

### API
- Google connector caches access tokens (5-min buffer)
- Connector responses limited to top 5 candidates
- CSV import validates before database writes

## Extensibility

### Add a New Platform
1. Create `src/lib/connectors/impl/platform.ts`
2. Implement `IConnector` interface
3. Add to `connectors` map in `discovery.ts`
4. Update UI to show new platform tab
5. Migration: Add `PlatformLocationLink` records

### Add a New Sync Field
1. Add to `StoreMasterProfile` schema
2. Run `npm run db:migrate`
3. Update connector to read/write field
4. Update sync logic in `updateLocation()`

### Add Notification Channel
1. Implement alert logic in `src/lib/alerts.ts`
2. Add environment variables
3. Call from feedback handler
4. Test with sample feedback

## Deployment

### Environment
- Development: SQLite locally, hot reload enabled
- Staging: Postgres, real Google connector
- Production: Postgres, all real connectors

### Deployment Process
1. Run `npm run build` (validates TypeScript, builds app)
2. Deploy Next.js to Vercel/Railway/self-hosted
3. Run `npm run db:migrate` on new database
4. Set environment variables
5. Scale as needed (serverless or traditional)

## Monitoring & Observability

### Logs
- Console logs on server-side (visible in `npm run dev`)
- Audit logs in database for user actions
- Error logs from connectors

### Metrics to Track
- Discovery success rate by platform
- Average candidate confidence scores
- Sync failure rate and reasons
- CSV import error rate
- User feedback volume

### Future
- OpenTelemetry integration
- APM (Application Performance Monitoring)
- Error tracking (Sentry)
- Analytics (Posthog)
