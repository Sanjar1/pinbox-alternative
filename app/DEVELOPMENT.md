# Development Guide

## Prerequisites

- Node.js 18+ (with npm)
- SQLite3 (bundled with Prisma)
- Git
- VS Code recommended (with TypeScript extension)

## Environment Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` from template:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL="file:./dev.db"
DISABLE_AUTH_FOR_TESTING="true"  # For local development

# Google Business Profile API (optional for testing)
GOOGLE_BP_CLIENT_ID="..."
GOOGLE_BP_CLIENT_SECRET="..."
GOOGLE_BP_REFRESH_TOKEN="..."

# Yandex operations (optional)
IMPORT_OWNER_EMAIL="your-email@example.com"

# Notifications (optional)
TELEGRAM_WEBHOOK_URL="..."
RESEND_API_KEY="..."
```

### 3. Database Setup
```bash
# Apply migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (with hot reload) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo user + 33 stores |
| `npm run import:telegram` | Import stores from Telegram channel |

## Scripts

### Extract Lat/Lng for Stores
```bash
node scripts/extract-yandex-latlng.mjs
# Outputs: data/stores-latlng.csv
# Then import via admin UI or script
```

### Import from Telegram
```bash
npm run import:telegram
# Reads: https://t.me/lokasiyasirnayalavka
# Creates/updates stores in database
```

## Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── admin/              # Admin dashboard
│   │   │   ├── stores/         # Store management
│   │   │   │   ├── [id]/       # Store detail page
│   │   │   │   │   └── discovery/  # Discovery UI
│   │   │   │   ├── import/     # CSV import
│   │   │   │   └── new/        # Create store
│   │   │   └── page.tsx        # Dashboard
│   │   ├── [slug]/             # Public QR feedback page
│   │   └── login/              # Auth
│   ├── lib/
│   │   ├── connectors/         # Platform integrations
│   │   │   ├── impl/           # Real implementations
│   │   │   ├── google.ts       # Google interface
│   │   │   ├── yandex.ts       # Yandex interface
│   │   │   └── types.ts        # Common types
│   │   ├── auth.ts             # Auth helpers
│   │   ├── db.ts               # Prisma instance
│   │   ├── discovery.ts        # Discovery engine
│   │   └── validation.ts       # Input validation
│   └── styles/                 # TailwindCSS
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.mjs                # Seed script
├── scripts/
│   ├── extract-yandex-latlng.mjs   # Lat/lng extraction
│   ├── import-telegram-channel.mjs # Telegram importer
│   └── batch-reply-negative-yandex.mjs # Yandex review replies
├── public/
│   └── stores-template.csv     # CSV import template
└── data/
    └── stores-latlng.csv       # Generated lat/lng data
```

## Testing

### Run Tests (if applicable)
```bash
npm test
```

### Manual Testing Checklist
- [ ] Login page loads
- [ ] Can create store with manual entry
- [ ] Can import stores from CSV
- [ ] Can run discovery for a single store
- [ ] Can run discovery for all stores
- [ ] Can view store details and location links
- [ ] Feedback submission works
- [ ] Admin dashboard loads

## Database

### View Data
```bash
# Open Prisma Studio
npx prisma studio
```

### Reset Database
```bash
# WARNING: Deletes all data
npx prisma migrate reset
npm run db:seed
```

## Code Style

- **Language:** TypeScript (strict mode)
- **Formatter:** Prettier (auto on save)
- **Linter:** ESLint with Next.js config
- **Styling:** TailwindCSS utility classes
- **Database:** Prisma ORM

### Conventions
- Server actions: `'use server'` at top of file
- Client components: `'use client'` at top of file
- Database models: PascalCase (Prisma convention)
- API routes: minimal (prefer server actions)
- Components: functional with hooks

## Debugging

### Console Logs
- Server logs appear in terminal where `npm run dev` runs
- Client logs appear in browser DevTools

### Database Debugging
```bash
# View current database state
npx prisma studio

# See raw SQL queries (set in .env)
# DATABASE_URL="file:./dev.db?log=query"
```

### Performance Profiling
Next.js built-in profiling:
- Chrome DevTools Performance tab
- Next.js analytics (production)

## Common Development Tasks

### Add a New Route
1. Create file: `src/app/path/page.tsx`
2. Export default component
3. Uses App Router conventions

### Add a Database Model
1. Edit `prisma/schema.prisma`
2. Add new model
3. Run: `npm run db:migrate`
4. Use generated types: `import type { ModelName } from '@prisma/client'`

### Create a Server Action
1. Create/edit `.ts` file in route folder
2. Add `'use server'` at top
3. Export async function
4. Import in client component and call

### Add a New Platform Connector
1. Create `src/lib/connectors/impl/platform-name.ts`
2. Implement `IConnector` interface
3. Add to connectors map in `src/lib/discovery.ts`

## Known Issues & Workarounds

### Database Lock
**Symptom:** "database is locked" error
**Solution:** Restart dev server (`npm run dev`)

### Hot Reload Not Working
**Symptom:** Changes don't appear after file edit
**Solution:** Manually refresh browser (Ctrl+R) or restart server

### Prisma Type Errors
**Symptom:** Types not recognized after schema change
**Solution:** Run `npx prisma generate` to regenerate types

## Branch Strategy

- `main` - stable, production-ready
- `feature/*` - feature development
- Always create PR before merging to main

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
