# Musicle Clone

Daily music quiz inspired by [musicle.app](https://www.musicle.app). Three columns, four album covers each — listen to the 30-second preview and pick the matching cover. Decoys are picked to be plausibly similar (same artist, era ±5 years, same genre) so the puzzle is genuinely tricky.

Built as a fullstack study project: **Nuxt 3** on the front, **Express + Prisma + Postgres** on the back, audio + metadata from the **iTunes Search API** (free, hot-linked from Apple's CDN — never rehosted).

> Music data and audio previews provided by Apple Inc. (iTunes Search API).

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Nuxt 3 (SSR), Vue 3, TypeScript, Vuetify 3, Pinia, SASS |
| Backend | Node 22, Express, TypeScript, Zod |
| ORM/DB | Prisma + PostgreSQL 16 |
| Music API | iTunes Search (no auth, public) |
| Deploy | Vercel (frontend) + Render (backend + Postgres) |

The frontend follows a **module-per-feature** layout (`modules/<feature>/{api, store, types, components, views}`) plus a `shared/` folder for cross-cutting components, composables, and stores. SASS design tokens live in `styles/_tokens.sass` and per-theme CSS custom props in `styles/_themes.sass`. Theme is persisted in a cookie so SSR renders with the correct mode (no flash on first load).

The backend mirrors the same `ApiResponse<T>` shape on every endpoint and exposes only three routes:

- `GET /healthz` → liveness
- `GET /flavors` → list of available quizzes
- `GET /puzzles/daily?flavor=<id>&date=<YYYY-MM-DD>?` → today's puzzle

Daily puzzles are deterministic: `seed = hash(flavorId + date)` feeds a `mulberry32` PRNG that picks 3 target tracks and 3 decoys per target via tiered rules (same artist → year ±5 → same genre → random). The result is cached in `DailyPuzzleCache` so repeated calls cost a single DB read.

---

## Local setup

Prereqs: Docker (or any Postgres 16), [mise](https://mise.jdx.dev/) (or Node 22+ on your PATH), npm.

```bash
# 0. Trust the Node version pin
mise trust

# 1. Start Postgres on host port 5433 (5432 is reserved here for an existing
#    container — change docker-compose.yml if that's not your case)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed          # populates ~60 Rock tracks via iTunes Search
npm run dev           # http://localhost:3001

# 3. Frontend (in another terminal)
cd frontend
cp .env.example .env
npm install
npm run dev           # http://localhost:3000
```

Visit `http://localhost:3000/`, click **Rock**, hit play, and pick the cover that matches the audio.

### Smoke checks

```bash
curl http://localhost:3001/healthz
curl http://localhost:3001/flavors
curl 'http://localhost:3001/puzzles/daily?flavor=rock&date=2026-05-01' | jq .
```

The same `(flavor, date)` pair always returns the same puzzle.

---

## Project layout

```
musicle/
├── docker-compose.yml      Postgres 16 (host port 5433)
├── mise.toml               pins Node 22 (matches Render runtime)
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   Flavor, Track, DailyPuzzleCache
│   │   ├── migrations/
│   │   └── seed.ts         curated iTunes Search terms → Track pool
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/         /healthz, /flavors, /puzzles
│   │   ├── services/       itunes, puzzleGenerator, seedRandom (PRNG)
│   │   ├── middleware/     errorHandler
│   │   ├── lib/            prisma client singleton
│   │   └── types/          ApiResponse<T> helpers
│   └── render.yaml         Render Blueprint (web service + Postgres)
│
└── frontend/
    ├── nuxt.config.ts
    ├── app.vue
    ├── layouts/default.vue
    ├── pages/              index.vue, play/[flavor].vue
    ├── plugins/vuetify.ts  SSR + 2 themes (musicleLight / musicleDark)
    ├── modules/
    │   ├── flavors/        api, store, types, views, components
    │   ├── game/           api, store, types, views (PlayView), components
    │   └── stats/          localStorage-backed streak + ResultModal
    ├── shared/
    │   ├── components/     AppShell, AppHeader, AppFooter, ThemeToggle
    │   ├── composables/    useApi, useAudio (singleton), useTheme
    │   ├── stores/         theme
    │   └── types/          api-response
    ├── styles/
    │   ├── _tokens.sass    spacing, radius, font, durations
    │   ├── _themes.sass    [data-theme="light|dark"] CSS custom props (purple primary)
    │   ├── _mixins.sass    breakpoint helpers
    │   └── main.sass       entry
    └── vercel.json
```

---

## Environment variables

### Backend (`backend/.env`)

| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://musicle:musicle@localhost:5433/musicle?schema=public` | Prisma connection string |
| `PORT` | `3001` | HTTP port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origins (comma-separated, or `*` for any) |
| `ITUNES_BASE_URL` | `https://itunes.apple.com` | iTunes Search base |

### Frontend (`frontend/.env`)

| Var | Default | Purpose |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:3001` | Backend root used by `useApi()` and `useFetch` |

---

## Deploy

### Backend → Render

1. Push the repo to GitHub.
2. On Render, **New → Blueprint** and pick the repo. Render reads `backend/render.yaml`, provisions a Free web service plus a Free Postgres database, and wires `DATABASE_URL` automatically.
3. Open the new service → **Environment** → set `CORS_ORIGIN` to your eventual Vercel URL (e.g. `https://musicle.vercel.app`).
4. The first deploy runs `npm install && npm run build` (which calls `prisma generate`) and then `prisma migrate deploy && npm start` per `render.yaml`.
5. Open the **Shell** tab and run the seed once: `npm run seed`.

Free-tier caveats:
- The web service spins down after 15 min of inactivity → ~30 s cold start when a friend visits.
- Postgres Free has 90-day retention; back up `Track` rows or move to a paid plan if you keep the project running.

### Frontend → Vercel

1. **Add new project** → import the same GitHub repo.
2. **Root directory**: `frontend`. Framework should auto-detect as Nuxt.
3. **Environment variables** → add `NUXT_PUBLIC_API_BASE` pointing to your Render URL (e.g. `https://musicle-api.onrender.com`).
4. Deploy.

After both are up, copy the Vercel URL into Render's `CORS_ORIGIN` and redeploy the backend so the browser is allowed to talk to it.

---

## Adding more flavors

The MVP ships only **Rock**. To add another flavor:

1. Edit `backend/prisma/seed.ts` and append a new entry to the `FLAVORS` array, e.g.:
   ```ts
   {
     id: '80s',
     name: 'The 80s',
     description: 'Under pressure',
     targetTracks: 60,
     searchTerms: [
       'Michael Jackson Billie Jean',
       'Madonna Like a Virgin',
       // ...
     ],
   }
   ```
2. Run `npm run seed` (idempotent — it only inserts new rows).
3. The new flavor automatically appears in `GET /flavors` and as a card on the home page.

---

## How the puzzle stays fair

The audio you hear and the four cover options come from the same iTunes track records — no second source can drift out of sync. Each column's correct answer is identified client-side by comparing the `previewUrl` of each option with the column's `audio` URL. This is fine for the MVP; for a leaderboard version, validation would move server-side and the `previewUrl` field would be stripped from non-target options before the response leaves the API.

---

## Roadmap (post-MVP)

- Multi-flavor pool (80s, Pop, K-Pop, Jazz, Brasil, etc.)
- User accounts (`modules/auth`) + global leaderboard
- Server-side guess validation
- Rate limiting (`express-rate-limit`)
- PWA / installable
- i18n PT/EN

---

## Credits

- iTunes Search API for music metadata and 30 s previews — provided by Apple Inc.
- Game design inspired by [musicle.app](https://www.musicle.app/) (Wordle-style daily music quiz).
