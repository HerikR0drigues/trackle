# Musicle Clone

Daily music quiz inspired by [musicle.app](https://www.musicle.app). Study project for the Nuxt 3 + Express + Prisma + Postgres fullstack.

> Music data and audio previews provided by Apple Inc. (iTunes Search API).

## Stack

- **Frontend** — Nuxt 3, Vue 3, TypeScript, Vuetify 3, Pinia, SASS
- **Backend** — Node, Express, TypeScript, Prisma, Zod
- **DB** — Postgres 16 (Docker locally)
- **Music API** — iTunes Search (free, no key required)

## Local setup

```bash
# 1. Postgres up
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed   # populates ~80 rock tracks via iTunes Search
npm run dev    # http://localhost:3001

# 3. Frontend (in another terminal)
cd frontend
npm install
cp .env.example .env
npm run dev    # http://localhost:3000
```

## Project layout

```
musicle/
├── docker-compose.yml      Postgres 16 for local dev
├── frontend/               Nuxt 3 app
└── backend/                Express + Prisma API
```

