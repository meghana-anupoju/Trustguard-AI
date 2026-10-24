# Trustguard AI

Trustguard AI is a demo brand-protection dashboard that detects impersonating social accounts and suspicious mobile apps using heuristic brand-matching and scam-language checks.

## Features

- Overview dashboard with risk metrics and charts
- Brand profile management
- Social and app monitoring views
- Threat intelligence and reporting views
- Prioritized investigation queue with risk/evidence detail, official-asset matching, and description-overlap scoring
- Analyst decisions and timestamped investigation history persisted by the backend
- One-time in-app alerts for newly detected High/Critical cases and downloadable, evidence-based report drafts for confirmed threats
- Demo scan engine with risk scoring
- Backend API for scan and brand-profile data
- Best-effort public search connectors for Bluesky profiles and Apple App Store listings
- SQLite local persistence and managed PostgreSQL support for profiles, imports, scans, and investigation records
- Configurable name/risk thresholds and source health visibility
- Official social accounts and apps excluded from threat alerts
- Look-alike scoring for transpositions, spacing, and added brand words
- FAQ-based customer support assistant

## Project structure

```text
client/              React + TypeScript frontend
  public/            Static browser assets
  src/
    components/      Shared layout and reusable UI components
    context/         Application state and navigation
    data/            Brand-aware frontend demo data
    lib/             API client, detection, storage, and utilities
    pages/           Screen-level views
    types/           Shared TypeScript models
    App.tsx          Page routing and application shell
    main.tsx         Frontend entry point
  index.html         Vite HTML entry point
server/              Express API and backend services
  index.js           HTTP API routes and application startup
  sources.js         External source connectors and normalization
  detection.js       Server-side scoring and official-asset exclusion
  data.js            Brand-aware backend demo candidates
  database*.js       Database selection and persistence adapters
  *.test.js          Backend tests, kept beside the server modules
docs/                Architecture, data-source limits, and demo guidance
data/                Local database files (generated; git-ignored)
dist/                Generated production frontend build (git-ignored)
*.config.*           Shared root-level build and tooling configuration
```

Keep screen-specific UI in `client/src/pages`, reusable UI in `client/src/components`, and shared browser logic in `client/src/lib`. Keep API and persistence changes in `server`; add tests beside the server module they cover. Put architecture and operational guidance in `docs` and link it here rather than duplicating long explanations.

## Local development

```bash
npm install
npm run dev
```

The frontend runs from `client/` on http://localhost:5173 and the API runs from `server/` on http://localhost:3001. The root npm scripts start both services and the frontend proxies `/api` requests to the API. Local development uses `data/brandshield.sqlite` by default. Set `DATABASE_URL` to use PostgreSQL; SQLite is selected only when that variable is unset.

## Challenge demo materials

- Architecture, data-source limitations, official-asset exclusion, and a short judging demo flow: [docs/architecture.md](./docs/architecture.md)
- `npm test` exercises look-alike names, official-asset exclusion, suspicious candidates, unrelated legitimate examples, provider normalization/failure, threshold behavior, and SQLite persistence for scans and investigation history.

Bluesky and Apple App Store search results are fetched from their public search APIs only when an analyst explicitly starts a scan. The included candidate set is synthetic demo data. Other social networks and app stores are not connected, and these public searches do not provide continuous or comprehensive monitoring. Analysts can import JSON candidate exports; imports, brand profiles, and scans persist in the selected database. Provider availability and sample data are identified separately in the UI. Review each provider's terms, rate limits, and data use requirements before public deployment.

For durable hosting, configure a managed PostgreSQL database and set its connection string as the API's `DATABASE_URL` secret. Set `DATABASE_SSL=true` when the database provider requires TLS. The Render Blueprint prompts for `DATABASE_URL`; never commit the connection string. SQLite remains for local development because Render's service filesystem is ephemeral.

### Demo sign-in

The sign-in screen displays and accepts the demo credentials below:

- Email: `analyst@trustguard.ai`
- Password: `BrandShieldDemo2026!`

To customize them for a demo build, set `VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` before building. Vite embeds `VITE_*` values in the public frontend bundle, so these are public demo credentials only—not secure authentication. Do not use real or sensitive passwords.

## Demo deployment setup

### Option 1: Vercel (frontend)

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Use the default Vite settings.
4. Set the project root to the repository root.
5. Deploy.

### Option 2: Render (backend API)

1. Create a new Web Service in Render.
2. Connect the same GitHub repo.
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm run start`
4. Create or select a managed PostgreSQL database. Copy its private/internal connection URL when the database and API share a provider and region; use the provider's recommended URL otherwise.
5. In the API service's secret environment settings, set `DATABASE_URL` to that connection URL. Set `DATABASE_SSL=true` if required by the provider.
6. Deploy the API and check `https://<your-render-service>.onrender.com/api/health`.

Database hosting may incur separate charges; review the provider's current pricing and retention limits before creating the database. Do not commit `DATABASE_URL` or paste it into source files.

### Recommended for demo hosting

- Host the frontend on Vercel.
- Host the backend API on Render.
- After the API is deployed, set `VITE_API_BASE_URL` in Vercel to the Render API URL, then redeploy the frontend so the build includes the API origin.
- Set the variable for the Vercel Production environment (and Preview too if previews should use the API).

Example:

```env
VITE_API_BASE_URL=https://your-render-app.onrender.com
```

## Notes

This is a demo-ready MVP, not a production-grade monitoring platform. It is intended for hackathon demos, internal showcases, and proof-of-concept validation.
