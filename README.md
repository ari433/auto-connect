# AUTO CONNECT

Premium Albanian automotive marketplace. AUTO CONNECT imports premium vehicles
from South Korea and presents them as its own branded storefront, with
transparent pricing, advanced search, financing, an inventory-aware assistant,
and a full admin back office.

> The customer interface is **Albanian only**. The upstream inventory source is
> never surfaced in the customer experience — the platform is entirely AUTO CONNECT.

---

## Tech stack

- **Next.js 15** (App Router, RSC) · **React 19** · **TypeScript** (strict)
- **TailwindCSS** — handcrafted design system (brand red `#D6001C`, ink `#111`)
- **Prisma** · **PostgreSQL**
- **Zod** for validation · **lucide-react** icons

---

## Architecture

```
                 ┌─────────────────────────────────────────────┐
   Carapis API   │  src/lib/providers/carapis  (the ONLY file   │
  (Encar feed) ──▶  that knows Carapis paths/fields/auth)       │
                 └───────────────┬─────────────────────────────┘
                                 │ ProviderVehicle / Car
                 ┌───────────────▼───────────┐   ┌──────────────────┐
                 │  Sync engine (upsert +     │   │  Pricing engine   │
                 │  mark-sold)  src/lib/sync  │◀──│  KRW → EUR landed │
                 └───────────────┬───────────┘   └──────────────────┘
                                 │ Prisma
                        ┌────────▼────────┐
                        │  PostgreSQL      │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼───────────────────┐
              │  Search engine   │  Leads · Assistant │
              └──────────────────┼───────────────────┘
                                 │ our REST API + RSC
                        ┌────────▼────────┐
                        │  Frontend (Next) │  ← never talks to Carapis directly
                        └─────────────────┘
```

Key rule: **the frontend only ever calls our own endpoints.** All provider
access is server-side; the API key never reaches the browser.

### The Carapis provider (`src/lib/providers/carapis/index.ts`)

The single source of all Carapis-specific logic — fetch, auth, response
envelope, and field mapping. If Carapis versions its path (`/encar` →
`/v1/encar`) or renames fields, **this is the only file you touch** — and most of
it is overridable via env with no code change:

- `CARAPIS_BASE_URL`, `CARAPIS_VEHICLES_PATH` — path versioning is one env var.
- Auth: `Authorization: Bearer ${CARAPIS_API_KEY}` (added only when a key exists;
  the **Free Tier works with no key**).
- Response envelope `{ success, data: { vehicles, total, limit, offset } }` is
  read tolerantly, with defensive fallbacks for field-name variants.
- Two mappers from the raw feed: `mapToCar` (the Albanian `Car` contract served
  to the frontend) and `mapToProviderVehicle` (the richer catalogue record used
  by the sync engine).
- Typed errors: `INVALID_API_KEY`, `RATE_LIMIT_EXCEEDED`, `VEHICLE_NOT_FOUND`,
  plus network/upstream. `X-RateLimit-*` and `Retry-After` headers are honoured.
- Offline fallback: when the API is unreachable **and no key is set** (local
  dev), a bundled snapshot is served so the platform is never empty. Disabled
  automatically once a key is configured; force-off with `CARAPIS_ALLOW_FALLBACK=false`.

### `GET /api/inventory`

The public inventory endpoint. Returns `Car[]` **sorted by `priceKRW`
descending**. Two interchangeable sources (identical response shape → zero
frontend changes):

- `INVENTORY_SOURCE=live` (default) — pulls from Carapis on each request. Cars
  that leave the Encar feed simply stop being returned, so sold cars drop off
  automatically.
- `INVENTORY_SOURCE=db` — serves the synced catalogue from Postgres (instant
  loads, protects your API quota). Fed by the scheduled sync below.

### Auto-update (new cars appear, sold cars disappear)

- **Preferred — scheduled sync (quota-protecting).** `GET/POST /api/cron/inventory`
  runs `runSync(carapisProvider)`: it upserts every returned vehicle by its
  stable id and marks vehicles no longer returned as `SOLD`. Protected by
  `CRON_SECRET` (Vercel Cron sends `Authorization: Bearer <secret>`). Schedule in
  [`vercel.json`](./vercel.json) (default every 6 hours). Serve `/api/inventory`
  from `db`.
- **Simple fallback — live per request.** Leave `INVENTORY_SOURCE=live`; no DB
  cron needed.
- **Webhooks.** If the plan supports `vehicle.created` / `vehicle.updated`,
  subscribe and call `runSync` from the webhook handler instead of polling.

### Pricing engine (`src/lib/pricing`)

Deterministic, fully env-configurable KRW→EUR landed-cost calculation
(FX, freight, customs duty, VAT, compliance, margin, rounding) with a full
breakdown for admin. Only the final price is ever exposed to customers. The
`Car` feed uses the simple configurable rate (`PRICING_FX_KRW_EUR`) for its
`priceEUR`, per the public contract.

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env        # set DATABASE_URL (+ CARAPIS_API_KEY when you have one)

# 3. Database
npm run prisma:push         # create tables
npm run db:seed             # first inventory sync (falls back to snapshot offline)

# 4. Run
npm run dev                 # http://localhost:3000
```

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:push` | Sync schema to the database |
| `npm run db:seed` | Run an inventory sync (seed) |

---

## Pages

| Route | Description |
| --- | --- |
| `/` | Homepage — hero, featured stock, process, assistant teaser |
| `/inventari` | Inventory + advanced filters, search results, pagination |
| `/vetura/[slug]` | Vehicle details — gallery, specs, financing, inquiry, related |
| `/financimi` | Financing calculator + request an offer |
| `/asistenti` | Inventory-aware assistant (Albanian) |
| `/te-preferuarat` | Favorites (localStorage) |
| `/rreth-nesh`, `/kontakt` | About, Contact |
| `/admin`, `/admin/leads`, `/admin/sync` | Dashboard, lead management, sync |

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/inventory` | Public `Car[]` feed (sorted by KRW desc; live or db) |
| `GET /api/vehicles` · `/api/vehicles/[slug]` | Catalogue search + detail |
| `GET /api/facets` · `/api/models` | Filter facets + dependent models |
| `POST /api/leads` · `GET` · `PATCH /api/leads/[id]` | Lead capture + management |
| `POST /api/assistant` | Inventory-aware recommendations |
| `GET/POST /api/sync` · `/api/cron/inventory` | Manual + scheduled sync |

---

## Deployment

Deploy to Vercel. Set `DATABASE_URL`, `CARAPIS_API_KEY`, `CRON_SECRET`,
`INVENTORY_SOURCE`, `ADMIN_TOKEN`, and `NEXT_PUBLIC_SITE_URL`. `vercel.json`
registers the sync cron. Run `prisma migrate deploy` (or `prisma db push`) on
release.

SEO is production-ready: metadata, OpenGraph, JSON-LD (`AutoDealer`, `Car`,
`BreadcrumbList`), dynamic `sitemap.xml`, and `robots.txt`.
