# Northline Roofing & Exteriors — Config-Driven Estimator & Owner Panel

A two-surface tool for a roofing company: a public, mobile-first cost
estimator for homeowners, and an authenticated owner panel where the
business owner (or bookkeeper) can change prices, edit question labels,
toggle questions, and review captured leads — **with no code changes and
no redeploy**. Every question, label, option, and rate the public
estimator shows comes from the database at request time; the frontend
does not know what the questions are until it asks the API.

Built for the Wantace SDE Intern take-home assignment.

## Live deployment

| Surface | URL |
|---|---|
| Public estimator | `https://northline-estimator.vercel.app` |
| Owner panel | `https://northline-estimator.vercel.app`/admin/login |
| API | `https://northline-estimator-api.onrender.com` |

**Owner panel login:** set via the `ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables (see [Environment variables](#environment-variables)).

## How it's built

```
wantace-estimator/
├── backend/     Express API + MongoDB/Mongoose. Owns the pricing engine,
│                validation, auth, and the database.
└── frontend/    React (Vite) + Tailwind. Renders whatever GET /api/config
                 returns — no hardcoded questions, labels, or rates.
```

- **Backend:** Node.js, Express, MongoDB via Mongoose, JWT auth for the
  owner panel.
- **Frontend:** React (Vite), Tailwind CSS, React Router. No UI kit —
  hand-built components kept intentionally small.
- **Why this stack over Postgres/Prisma:** see `DECISIONS.md`.

## Running it locally from a clean clone

You'll need Node.js v18+ and a MongoDB connection string (a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster works fine, or a
local `mongod`).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI to your database, set JWT_SECRET to any long
# random string, and set/confirm ADMIN_USERNAME / ADMIN_PASSWORD

npm run seed   # loads the seed config + 3 historical leads from the brief
npm run dev    # starts the API on http://localhost:4000
```

Confirm it's up: `curl http://localhost:4000/api/health` → `{"ok":true}`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
# .env defaults to VITE_API_URL=http://localhost:4000, which matches the
# backend above — only change this if you moved the API's port.

npm run dev    # starts the app on http://localhost:5173
```

Open `http://localhost:5173` for the public estimator, or
`http://localhost:5173/admin/login` for the owner panel (credentials
above).

### 3. Run the pricing-engine tests (optional but recommended)

```bash
cd backend
npm test
```

## Environment variables

### `backend/.env`

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Signs owner-panel session tokens. Use a long random string. |
| `JWT_EXPIRES_IN` | Session length, e.g. `12h`. |
| `ADMIN_USERNAME` | Owner panel login username. |
| `ADMIN_PASSWORD` | Owner panel login password (hashed in memory at startup — never logged or stored in the DB). |
| `PORT` | Port the API listens on. Defaults to `4000`. |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins, e.g. `http://localhost:5173,https://your-app.vercel.app`. |

### `frontend/.env`

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the deployed backend, no trailing slash. |

## Deploying

This was built and tested to deploy as:

- **Frontend → Vercel or Netlify.** Set the project root to `frontend/`,
  build command `npm run build`, output directory `dist`. Add the
  `VITE_API_URL` env var pointing at your deployed backend.
- **Backend → Render or Railway.** Set the project root to `backend/`,
  build command `npm install`, start command `npm start`. Add all the
  backend env vars above. After the first deploy, run `npm run seed`
  once (Render/Railway both support a one-off shell command against the
  deployed service) to populate the database.
- **Database → MongoDB Atlas** free tier. Create a cluster, add a
  database user, allow network access from your backend host (or `0.0.0.0/0`
  for simplicity on a free-tier project like this), and copy the
  connection string into `MONGO_URI`.

After deploying, update the CORS_ORIGINS on the backend to include your
real frontend URL, and update this README's live links.

## Verifying the core rule (do this before you submit)

1. In the owner panel, change the Architectural Shingle rate to
   `$7.00/sqft` and save.
2. In an incognito window, complete the public estimator with that
   material selected — the new rate is reflected immediately, with no
   server restart.
3. Try opening `/admin` directly (not `/admin/login`) in a fresh
   incognito window — you're redirected to the login page, and the API
   itself returns `401` for `/api/admin/*` without a valid token.

## Project docs

- [`DECISIONS.md`](./DECISIONS.md) — assumptions, the pricing formula in
  plain language, scope cuts, and open questions for the client.
- [`AI_LOG.md`](./AI_LOG.md) — how AI tools were used on this build.
