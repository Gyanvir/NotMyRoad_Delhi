# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   ├── not-my-road/        # React + Vite frontend (Not My Road app)
│   └── nmr-mobile/         # React Native Expo mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Not My Road App

A civic-tech platform for reporting road issues in Delhi, India.

### Features
- Email/password authentication (session cookies for web, JWT Bearer for mobile)
- Multi-step report wizard (photo, location, issue type, authority)
- User dashboard with report status and timeline
- Community feed with filtering
- Home screen with live stats
- Tweet draft generation per report
- Dark urban theme with neon green (#00FF7F) highlights

### Auth Strategy
- **Web**: express-session cookies (httpOnly, 7-day)
- **Mobile**: JWT returned in login/register response, stored in AsyncStorage, sent as `Authorization: Bearer <token>`
- Backend accepts both via JWT middleware in `app.ts` that populates `req.session.userId` from the Bearer token

### Demo account
- Email: demo@notmyroad.in
- Password: Demo@1234

### DB Schema
- `users` table: id, email, password_hash, name, created_at
- `reports` table: id, user_id, user_name, image_url, latitude, longitude, area, issue_type, road_type, description, authority, status, tweet_draft, timeline (JSON), created_at, updated_at

### API Routes
- `GET /api/healthz` - health check
- `GET /api/stats` - platform stats
- `GET /api/reports` - list all reports (supports ?userId= ?status= ?limit=)
- `POST /api/reports` - create report
- `GET /api/reports/:id` - single report
- `PATCH /api/reports/:id` - update status
- `POST /api/auth/register` - register
- `POST /api/auth/login` - login
- `GET /api/auth/me` - current user
- `POST /api/auth/logout` - logout

### Mobile App (`artifacts/nmr-mobile`, `@workspace/nmr-mobile`)

React Native + Expo mobile app sharing the same API client.

- **Stack**: Expo Router (file-based routing), React Query, `@workspace/api-client-react`
- **Auth**: JWT stored in AsyncStorage; `setAuthTokenGetter` supplies token on every API request
- **Screens**:
  - `app/(tabs)/index.tsx` — Home: live stats, recent reports, report CTA
  - `app/(tabs)/feed.tsx` — Community Feed with status filter chips
  - `app/(tabs)/report.tsx` — 4-step report wizard (details, location, authority, review)
  - `app/(tabs)/dashboard.tsx` — My Reports with per-status stats
  - `app/(tabs)/profile.tsx` — Login/Register form + profile view
  - `app/report/[id].tsx` — Report detail with timeline, share-as-tweet
- **Components**: `StatusBadge`, `ReportCard`, `StatCard`
- **Theme**: `constants/colors.ts` — dark bg `#080808`, neon green `#00FF7F`
- **Base URL**: Set at layout init from `EXPO_PUBLIC_DOMAIN` env var

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, session, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
  - `health.ts` — `GET /api/healthz`
  - `auth.ts` — auth routes (register, login, me, logout)
  - `reports.ts` — report CRUD + stats
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.mjs`)

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/reports.ts` — users and reports table definitions
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`.
