# Anti-Rigging War Room - AI Agent Instructions

## Project Overview
Full-stack election integrity monitoring system with forensic analysis tools (Klimek Model, Benford's Law, Network Analysis), parallel vote tabulation (PVT), real-time dashboards, and volunteer mobile app. Built for detecting electoral fraud through statistical analysis and crowdsourced data verification.

**Tech Stack:** React 19 + Vite + Express + tRPC v11 + Drizzle ORM (MySQL) + Tailwind CSS v4 + shadcn/ui + TypeScript

**Architecture Pattern:** Modular monorepo with Repository Pattern, Service Layer, Event-Driven alerts, Transaction Management, and Rate Limiting

## Architecture

### Monorepo Structure
```
client/src/
  pages/             # Route components (wouter)
  components/ui/     # shadcn/ui + skeleton loaders
  hooks/             # useOptimisticUpdates, custom hooks
  lib/trpc.ts        # tRPC client with superjson
server/
  routers/           # Modular routers (auth, klimek, etc.)
  services/          # Business logic (klimek.service.ts)
  repositories/      # Data access layer (station.repository.ts)
  events/            # Event bus for alerts
  middleware/        # Rate limiting, validation
  _core/             # Auth, database, errors, SDK
shared/              # Types, constants
drizzle/             # Schema, migrations, indexes
```

### Request Flow
1. **Client → Server:** `trpc.{router}.{procedure}.useQuery()` or `.useMutation()` (see [client/src/lib/trpc.ts](client/src/lib/trpc.ts))
2. **Auth:** JWT session cookies validated in `createContext()` → `protectedProcedure` or `adminProcedure` middleware
3. **Data:** All database queries in [server/db.ts](server/db.ts) using Drizzle ORM
4. **Response:** Serialized with `superjson` (handles Dates, BigInts)

## Development Workflows

### Running the App
```bash
pnpm dev          # Runs server + Vite dev server (HMR enabled)
pnpm build        # Builds client (vite build) + server (esbuild bundle)
pnpm start        # Production mode (serves static files)
pnpm check        # TypeScript check (noEmit)
pnpm test         # Vitest (server/**/*.test.ts)
```

### Database
```bash
pnpm db:push      # Generate migrations + apply to MySQL
```
- Uses Drizzle ORM with MySQL dialect
- Schema: [drizzle/schema.ts](drizzle/schema.ts) (users, pollingStations, electionData, evidence, fraudAlerts, volunteers, etc.)
- Connection: `DATABASE_URL` env var

### Environment Variables
Required in `.env`:
- `DATABASE_URL` - MySQL connection string
- `OAUTH_SERVER_URL` - OAuth server for login (Manus platform)
- `VITE_APP_ID` - App ID for OAuth
- `JWT_SECRET` - Session token signing
- `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` - Storage proxy (S3-like)

## Code Patterns

### tRPC Routers (Modular)
**Server:** Routers split into separate files in [server/routers/](server/routers/)
```typescript
// server/routers/auth.router.ts
export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(...)
});

// server/routers/klimek.router.ts (uses service layer)
export const klimekRouter = router({
  analyze: protectedProcedure.query(async () => {
    const data = await getElectionDataForAnalysis();
    return klimekService.calculateKlimekAnalysis(data);
  })
});

// server/routers/index.ts
export const appRouter = router({
  auth: authRouter,
  klimek: klimekRouter,
  // ... import from separate files
});
```

**Client:** Call with `trpc.{router}.{procedure}.useQuery()` or `.useMutation()`
```tsx
const { data } = trpc.klimek.analyze.useQuery();
const mutation = trpc.volunteer.submit.useMutation({
  onSuccess: () => toast.success("Submitted!")
});
```

### Authentication
- **OAuth Flow:** [server/_core/oauth.ts](server/_core/oauth.ts) → exchange code → JWT session cookie
- **Middleware:** `protectedProcedure` (requires user), `adminProcedure` (requires role='admin')
- **Error Messages:** Use `UNAUTHED_ERR_MSG`, `NOT_ADMIN_ERR_MSG` from [shared/const.ts](shared/const.ts)
- **Client Redirect:** Automatic logout redirect in [client/src/main.tsx](client/src/main.tsx) when unauthorized

### Database Layer (Repository Pattern)
Use repositories in [server/repositories/](server/repositories/) - **never write queries in routers**:
```typescript
// server/repositories/station.repository.ts
export class StationRepository {
  async findByCode(code: string): Promise<Station | null> {
    const db = await getDb();
    return db.select().from(stations).where(eq(stations.code, code));
  }
  
  async create(data: InsertStation): Promise<Station> {
    return withTransaction(async (tx) => {
      const [result] = await tx.insert(stations).values(data);
      return this.findById(result.insertId);
    });
  }
}
```

**Transaction Support:**
```typescript
import { withTransaction } from '@/server/_core/database';

await withTransaction(async (tx) => {
  await tx.insert(stations).values(data);
  await tx.insert(electionData).values(votes);
});
```

Use Drizzle query builder: `eq()`, `desc()`, `and()`, `gte()`, `lte()`, `sql()`
Indexes defined in [drizzle/indexes.ts](drizzle/indexes.ts)

### UI Components
shadcn/ui components in [client/src/components/ui/](client/src/components/ui/):
- Tailwind v4 with `@tailwindcss/vite` plugin
- Variants via `class-variance-authority` (see [button.tsx](client/src/components/ui/button.tsx))
- Dark mode via `next-themes` ([ThemeContext.tsx](client/src/contexts/ThemeContext.tsx))
- Always use `cn()` utility from `@/lib/utils` for conditional classes

### Path Aliases
```typescript
"@/*" → client/src/*
"@shared/*" → shared/*
```

### Routing
Uses `wouter` v3 (not React Router):
```tsx
<Route path="/admin/klimek" component={KlimekAnalysis} />
```
Navigation: `import { useLocation } from "wouter"; const [, setLocation] = useLocation();`

## Domain-Specific Context

### Forensic Analysis Modules
- **Klimek Model:** Vote stuffing (alpha > 0.05) + vote stealing (beta > 0.3) detection via turnout/voteShare correlation (see [server/routers.ts](server/routers.ts#L32-L65))
- **Benford's Law:** Second-digit frequency analysis (chi-square test > 16.92 = suspicious)
- **Network Analysis:** Detects hub stations with abnormal outgoing transactions (centrality score)
- **Spatial Correlation:** Z-score analysis for neighboring districts

### Volunteer System
- **Codes:** Generated in [server/routers.ts](server/routers.ts) (`volunteerCode` router) - 6-digit codes with expiry
- **Submissions:** Photos + vote counts → PVT comparison → gap alerts when discrepancy > threshold

### External Integrations
- **OCR:** Gemini/Deepseek APIs for ballot photo parsing ([server/geminiOcr.ts](server/geminiOcr.ts), [server/deepseekOcr.ts](server/deepseekOcr.ts))
- **Notifications:** LINE Notify + Discord webhooks for alerts ([server/lineNotify.ts](server/lineNotify.ts), [server/discordNotify.ts](server/discordNotify.ts))
- **Storage:** Custom S3-like proxy via `storagePut()` in [server/storage.ts](server/storage.ts)

## Testing
- **Framework:** Vitest with node environment
- **Unit Tests:** Services and repositories ([server/services/*.test.ts](server/services/))
- **Integration Tests:** Repository tests with mocked DB
- **Pattern:** `describe()` blocks with `it()` tests
- **Coverage:** Run `pnpm test` - aim for >80% coverage
- **Mocking:** Use `vi.fn()`, `vi.mock()` for external services

**Example Test:**
```Create/update router in [server/routers/{domain}.router.ts](server/routers/)
2. Use service layer for business logic ([server/services/](server/services/))
3. Use repository for data access ([server/repositories/](server/repositories/))
4. Add rate limiting if public endpoint
5. Write tests in `*.test.ts`
6. Use `trpc.{router}.{procedure}` in client

**Add new page:**
1. Create component in `client/src/pages/`
2. Add `<Route>` in [client/src/App.tsx](client/src/App.tsx)
3. Wrap with layout (`AdminLayout`, `VolunteerLayout`)
4. Add skeleton loader for loading state
5. Use optimistic updates for mutations

**Add database table:**
1. Define schema in [drizzle/schema.ts](drizzle/schema.ts)
2. Add indexes in [drizzle/indexes.ts](drizzle/indexes.ts)
3. Run `pnpm db:push`
4. Create repository class in [server/repositories/](server/repositories/)
5. Write repository tests

**Handle errors properly:**
```typescript
import { NotFoundError, ValidationError } from '@/server/_core/errors';

if (!station) throw new NotFoundError('Station', stationId);
if (votes < 0) throw new ValidationError('Votes cannot be negative', 'votes');
```
## Common Tasks

**Add new tRPC endpoint:**
1. Add procedurequeries in routers - use repositories
- ❌ Don't put business logic in repositories - use services
- ❌ Don't skip `protectedProcedure`/`adminProcedure` for auth
- ❌ Don't forget transaction for multi-table operations
- ❌ Don't skip rate limiting for public endpoints
- ❌ Don't use generic Error - use custom error classes
- ❌ Don't use React Router patterns (use wouter)
- ❌ Don't import from `@radix-ui` directly (use `@/components/ui/*`)
- ❌ Don't skip tests for new features
- ❌ Don't forget database indexes for frequently queried columns
- ❌ Don't skip optimistic updates for better UX
1. Create component in `client/src/pages/`
2. Add `<Route>` in [client/src/App.tsx](client/src/App.tsx)
3. Wrap with `AdminLayout`, `DashboardLayout`, or `VolunteerLayout` if needed

**Add database table:**
1. Define schema in [drizzle/schema.ts](drizzle/schema.ts)
2. Run `pnpm db:push` to generate migration
3. Add queries to [server/db.ts](server/db.ts)

## Anti-Patterns
- ❌ Don't write SQL in routers - use db.ts functions

### Architecture
- [server/routers/](server/routers/) - Modular router files
- [server/services/](server/services/) - Business logic layer
- [server/repositories/](server/repositories/) - Data access layer
- [server/events/event-bus.ts](server/events/event-bus.ts) - Event-driven alerts
- [server/_core/database.ts](server/_core/database.ts) - Transaction helpers
- [server/_core/errors.ts](server/_core/errors.ts) - Custom error classes
- [server/middleware/ratelimit.ts](server/middleware/ratelimit.ts) - Rate limiting

### Database
- [drizzle/schema.ts](drizzle/schema.ts) - Database schema (MySQL)
- [drizzle/indexes.ts](drizzle/indexes.ts) - Performance indexes
- [server/db.ts](server/db.ts) - Legacy query functions (migrate to repositories)

### Client
- [client/src/App.tsx](client/src/App.tsx) - Routes + layouts
- [client/src/hooks/useOptimisticUpdates.ts](client/src/hooks/useOptimisticUpdates.ts) - Optimistic mutations
- [client/src/components/ui/skeleton-loader.tsx](client/src/components/ui/skeleton-loader.tsx) - Loading states

### Core
- [server/_core/trpc.ts](server/_core/trpc.ts) - tRPC setup + auth middleware
- [server/_core/oauth.ts](server/_core/oauth.ts) - OAuth flow
- [shared/const.ts](shared/const.ts) - Shared constants

## Best Practices Summary

✅ **DO:**
- Use modular routers, services, and repositories
- Wrap multi-table operations in `withTransaction()`
- Use custom error classes for consistent error handling
- Add rate limiting to public endpoints
- Write tests for new features
- Add database indexes for performance
- Use optimistic updates for better UX
- Add skeleton loaders for loading states
- Emit events for cross-cutting concerns (alerts)

🎯 **Performance:**
- Batch operations instead of loops
- Use database indexes
- Implement caching where appropriate
- Lazy load heavy components

🔒 **Security:**
- Always validate input with Zod
- Use `protectedProcedure` or `adminProcedure`
- Implement rate limiting
- Sanitize user-uploaded content
## Key Files Reference
- [server/routers.ts](server/routers.ts) - All API endpoints (appRouter with 20+ nested routers)
- [server/db.ts](server/db.ts) - All database operations
- [drizzle/schema.ts](drizzle/schema.ts) - Database schema (MySQL)
- [client/src/App.tsx](client/src/App.tsx) - Routes + layouts
- [server/_core/trpc.ts](server/_core/trpc.ts) - tRPC setup + auth middleware
