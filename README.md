# Parent Helper App (Express + Vite Edition)

A comprehensive platform for discovering baby and toddler activities across the United Kingdom. The stack now runs on an Express API with a Vite + React client, removing all previous Astro tooling.

## Features

- Smart search with location, category, and keyword filters
- Real-time class data backed by Supabase/PostgreSQL and Drizzle ORM
- Responsive UI built with React, TailwindCSS, Radix UI, and shadcn/ui
- Provider, franchise, and admin tools for managing class listings

## Technology Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + Drizzle ORM
- **Database**: Supabase (PostgreSQL)
- **Styling**: TailwindCSS, Radix UI primitives, shadcn/ui
- **Build**: `tsc` for the backend, Vite for the client bundle

## Quick Start

```bash
npm install
npm run dev:both   # starts Express on 3000 and Vite on 5173
```

- API only: `npm run dev`
- Frontend only: `npm run dev:frontend`
- Visit http://localhost:5173 for the UI, http://localhost:3000 for the API health check

## Build & Deploy

```bash
npm run build   # runs tsc and vite build
npm start       # executes node dist/server/index.js
```

The output in `dist/` is ready for Railway, Render, or any Node hosting provider.

## Environment Setup

Create a `.env` file with the credentials required by the modules you use:

```
DATABASE_URL=postgresql_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_public_anon_key
SESSION_SECRET=some-long-random-string
```

Check files within `server/` for any additional variables (e.g., SendGrid, Stripe, Instagram automation).

## Project Structure

```
├── server/            # Express server, routes, integrations, automation scripts
├── src/               # Vite + React application (primary client)
│   ├── components/    # Shared UI components
│   ├── pages/         # Route components rendered via Wouter
│   └── lib/           # Hooks, clients, utilities
├── client/            # Alternate/lightweight client build (React + Vite)
├── shared/            # Database schema and shared types (Drizzle + Zod)
├── public/            # Static assets served by Vite
├── vite.config.ts     # Vite configuration for the React client
└── tsconfig.json      # TypeScript configuration for both client and server
```

## Railway Deployment Tips

1. Set all required environment variables in the Railway dashboard.
2. Run `npm run build` as a build step.
3. Use `npm start` for the start command (`node dist/server/index.js`).
4. Ensure `NODE_ENV=production` so Express serves the built assets.

The repository is now free of Astro code and configuration—only the Express + Vite setup remains.
