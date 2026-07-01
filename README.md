# Eat Ticker

A minimalist, production-ready app for managing company dining. Pick who's eating for each
lunch and dinner, and employees are **automatically seated into dining rooms of 12** by
priority — with guests always seated first. Track attendance history and analytics on the
dashboard.

Built to run **100% free**: Next.js on Vercel + Neon Postgres (both free tiers). SQLite is used
for local development so you can run it offline with zero setup.

## Features

- **Today's Meal** — select employees as cards; dining rooms fill instantly by priority as you
  pick. Add one-off guests per meal (seated first). Save the plan.
- **Employees** — full CRUD with search, sort, category and status filters, and active toggles.
- **Dashboard** — summary cards, four Recharts visualizations (lunch/dinner attendance,
  category breakdown, rooms used) and a filterable history table. Click any row for details.
- **Polish** — dark mode, command palette (`⌘/Ctrl + K`), toasts, loading skeletons,
  confirmation dialogs, responsive layout, and installable as a PWA.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma ·
SQLite (dev) / PostgreSQL (prod) · Recharts · React Hook Form · Zod.

## The seating algorithm

The core rule lives in [`src/lib/assignment.ts`](src/lib/assignment.ts) as a pure, testable
function:

1. **Guests first** — they outrank everyone and seat in Room 1.
2. Then **employees by priority ascending** (lower number = higher priority; Boss = 1).
3. Fill Room 1 with the first 12, Room 2 with the next 12, and so on — growing to as many
   rooms as needed. Ties break by name for a stable result.

Each saved assignment stores a **snapshot** of the diner's name, category and priority, so
historical records stay accurate even if an employee is later edited or deleted.

## Local development

```bash
npm install          # also generates the Prisma client
npm run db:reset     # creates the SQLite dev.db and seeds sample data
npm run dev          # http://localhost:3000
```

Handy scripts: `npm run db:push` (sync schema), `npm run db:seed` (reseed),
`npm run db:studio` (Prisma Studio).

## Deploy to Vercel + Neon (free)

The Prisma schema is portable — the datasource `provider` is swapped automatically at build
time by [`scripts/set-db-provider.mjs`](scripts/set-db-provider.mjs) based on the
`DATABASE_PROVIDER` env var, and the models avoid Postgres-only features.

1. **Create a free Neon database** — in the Vercel dashboard, add the **Neon** integration
   (Storage → Create → Neon), or sign up at [neon.tech](https://neon.tech) and copy the
   pooled connection string.
2. **Import this repo into Vercel** (New Project).
3. **Set Environment Variables** in the Vercel project:
   - `DATABASE_PROVIDER` = `postgresql`
   - `DATABASE_URL` = your Neon connection string (`...?sslmode=require`)
4. **Deploy.** The build runs `prisma generate && prisma db push` against Neon, creating the
   tables automatically, then builds the app.

To seed production data once, run locally against Neon:

```bash
DATABASE_PROVIDER=postgresql DATABASE_URL="<neon-url>" npm run db:seed
```

> No authentication is included by design — data is shared across everyone who has the URL.

## Project structure

```
src/
  app/            # routes: dashboard (/), /meal, /employees, /meals/[id]
  components/     # app shell, command palette, shared UI, shadcn/ui primitives
  lib/            # constants, types, assignment algorithm, validators, date & utils
  server/         # queries (server-only) and mutation actions ("use server")
prisma/           # schema + seed
scripts/          # db-provider swap for portable SQLite/Postgres builds
```
