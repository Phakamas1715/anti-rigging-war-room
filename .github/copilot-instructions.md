# Anti-Rigging War Room - AI Agent Instructions

## Project Overview
Full-stack election integrity monitoring system with forensic analysis tools (Klimek Model, Benford's Law, Network Analysis), parallel vote tabulation (PVT), real-time dashboards, and volunteer mobile app. Built for detecting electoral fraud through statistical analysis and crowdsourced data verification.

**Tech Stack:** React 19 + Vite + Express + tRPC v11 + Drizzle ORM (MySQL) + Tailwind CSS v4 + shadcn/ui + TypeScript

## Architecture

### Monorepo Structure
```
client/src/          # React SPA (Vite)
  pages/             # Route components (wouter)
  components/ui/     # shadcn/ui components with CVA variants
  lib/trpc.ts        # tRPC client setup with superjson transformer
server/              # Express + tRPC API server
  routers.ts         # Main appRouter with 20+ nested routers
  db.ts              # Drizzle ORM queries (711 lines)
  _core/             # Auth (OAuth + JWT), env, SDK, systemRouter
  *.ts               # Domain modules (geminiOcr, klimek, lineNotify, etc.)
shared/              # Types, constants shared between client/server
drizzle/             # Database schema and migrations
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

### tRPC Routers
**Server:** Define in [server/routers.ts](server/routers.ts) (2257 lines, 20+ nested routers)
```typescript
export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { /* clear cookie */ })
  }),
  klimek: router({
    analyze: protectedProcedure.query(async () => {
      const data = await getElectionDataForAnalysis();
      return calculateKlimekAnalysis(data);
    })
  })
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

### Database Queries
All queries in [server/db.ts](server/db.ts) - **never write raw SQL in routers**:
```typescript
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  await db.insert(users).values(user).onDuplicateKeyUpdate({ set: { ...user } });
}
```
Use Drizzle's query builder: `eq()`, `desc()`, `and()`, `gte()`, `lte()`, `sql()`

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
- **Pattern:** `describe()` blocks with `it()` tests (see [server/klimek.test.ts](server/klimek.test.ts))
- **Location:** `server/**/*.test.ts` files only
- **Mocking:** Use `vi.fn()`, `vi.mock()` for external services

## Common Tasks

**Add new tRPC endpoint:**
1. Add procedure to relevant router in [server/routers.ts](server/routers.ts)
2. Add database query to [server/db.ts](server/db.ts) if needed
3. Use `trpc.{router}.{procedure}` in client components

**Add new page:**
1. Create component in `client/src/pages/`
2. Add `<Route>` in [client/src/App.tsx](client/src/App.tsx)
3. Wrap with `AdminLayout`, `DashboardLayout`, or `VolunteerLayout` if needed

**Add database table:**
1. Define schema in [drizzle/schema.ts](drizzle/schema.ts)
2. Run `pnpm db:push` to generate migration
3. Add queries to [server/db.ts](server/db.ts)

## Anti-Patterns
- ❌ Don't write SQL in routers - use db.ts functions
- ❌ Don't skip `protectedProcedure`/`adminProcedure` for auth routes
- ❌ Don't use React Router patterns (use wouter)
- ❌ Don't import from `@radix-ui` directly (use `@/components/ui/*`)
- ❌ Don't create separate API endpoints (always use tRPC)

## Key Files Reference
- [server/routers.ts](server/routers.ts) - All API endpoints (appRouter with 20+ nested routers)
- [server/db.ts](server/db.ts) - All database operations
- [drizzle/schema.ts](drizzle/schema.ts) - Database schema (MySQL)
- [client/src/App.tsx](client/src/App.tsx) - Routes + layouts
- [server/_core/trpc.ts](server/_core/trpc.ts) - tRPC setup + auth middleware
