# Development Guide

## Prerequisites

- Node.js 18+
- Docker Desktop (for Postgres + Redis)
- npm

## Environment Setup

1. **First-time setup (automated):**
   ```
   0_SETUP_AND_START.bat
   ```
   This runs Docker, installs dependencies, runs migrations, seeds the database, and starts the app.

2. **Manual setup:**
   ```bash
   # Start Docker services
   docker compose up -d

   # Install dependencies
   cd app
   npm install

   # Run database migrations
   npm run db:migrate

   # Seed database
   npm run db:seed

   # Start dev server
   npm run dev
   ```

3. **Environment variables:** Copy `app/.env.example` to `app/.env` and fill in:
   - `DATABASE_URL` - SQLite path or Postgres connection string
   - `YANDEX_GEOCODER_API_KEY` - Yandex geocoder key for real discovery (optional; mock fallback exists)
   - `DISABLE_AUTH_FOR_TESTING` - Set to `true` to bypass login in dev

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with initial data |
| `npm run import:telegram` | Import stores from Telegram channel |

## Windows Batch Scripts

| Script | Description |
|--------|-------------|
| `0_SETUP_AND_START.bat` | Full first-time setup + start |
| `1_FIRST_TIME_SETUP.bat` | Install + migrate + seed only |
| `2_START_APP.bat` | Start app only (assumes setup done) |
| `3_IMPORT_TELEGRAM_LOCATIONS.bat` | Import stores from Telegram + generate audit |

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| Postgres 15 | 5432 | Database (production path) |
| Redis 7 | 6379 | Cache/queue (available, not yet used in app) |

Credentials: `admin` / `password123` / `pinbox` (dev only)

## Project Structure

```
Pinbox alternative/
|-- app/                          # Next.js application
|   |-- prisma/
|   |   `-- schema.prisma         # Database schema
|   |-- src/
|   |   |-- app/                  # Next.js App Router pages
|   |   |   |-- admin/            # Admin dashboard
|   |   |   |   |-- stores/       # Store management
|   |   |   |   |   |-- [id]/     # Store detail + sync
|   |   |   |   |   |   `-- discovery/  # Yandex matching
|   |   |   |   `-- page.tsx      # Admin home
|   |   |   `-- [slug]/           # Public QR landing page
|   |   `-- lib/                  # Shared libraries
|   |       |-- connectors/       # Platform connectors (Yandex active)
|   |       |-- rollback/         # Rollback service
|   |       |-- auth.ts           # Authentication
|   |       |-- db.ts             # Prisma client
|   |       |-- discovery.ts      # Discovery engine
|   |       `-- audit.ts          # Audit logging
|   `-- package.json
|-- docs/                         # Project documentation
|-- scripts/                      # Utility scripts
|-- docker-compose.yml            # Dev infrastructure
`-- *.bat                         # Windows dev scripts
```

## Testing

- **Framework:** Playwright configured (test coverage expansion pending)
- **Build check:** `npm run build`
- **Lint check:** `npm run lint`
- **Smoke test:** Start app, navigate to `/admin/stores`, create store, run discovery

## Code Style

- TypeScript strict mode
- ESLint with Next.js config
- Tailwind CSS for styling
- Prisma for database access
- Server Actions for form handling

## Scope Note

- Active product scope is Yandex-only.
- Google and 2GIS docs are retained only as historical context.
