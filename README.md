# Dovio — Social App (Mobile + Backend)

A full-stack social app consisting of a React Native + Expo mobile client and a Node.js/Express + MongoDB backend. The app supports auth with email verification, posts, media uploads, stories, follows, messaging, notifications, wallet, and more.

- Mobile app lives at the repository root
- Backend lives in `Dovio.Backend/`

## Monorepo Layout

```
Dovio/                       # Mobile app (Expo + React Native)
├─ app/                      # Screens & navigation (Expo Router)
├─ services/                 # API service
├─ config/                   # API config
├─ contexts/                 # App contexts (Auth, Wallet, Messaging, ...)
├─ data/                     # Mock data used for fallback
├─ types/                    # Shared TS types
├─ package.json              # Mobile scripts
└─ Dovio.Backend/            # Backend API (Express + MongoDB)
```

## Tech Stack

- Mobile: React Native, Expo, Expo Router, TypeScript, React Query, AsyncStorage
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Joi validation, Helmet, CORS, Rate limiting, Multer (uploads), Jest + Supertest

## Prerequisites

- Node.js 18+
- Bun (recommended for mobile scripts) or npm
- MongoDB (local) or Dockerized Mongo, or use the built-in in-memory DB for tests

## Quick Start

Open two terminals: one for the backend API, one for the mobile app.

### 1) Backend API

```bash
cd Dovio.Backend
npm install

# Create .env
# See the Environment variables section for details

# Start in development (nodemon)
npm run dev
# or production
npm start
```

- Health check: http://localhost:5000/health
- Swagger docs: http://localhost:5000/api/docs

### 2) Mobile app

```bash
# From repo root
bun install

# Configure API base URL (see below)
# Start mobile dev server (Expo)
bun run start           # then type i (iOS) or a (Android)
# Web preview (optional)
bun run start-web
```

## Environment Variables

### Mobile (.env at repo root)

```env
# Preferred explicit base URL (avoid relying on auto host detection)
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
# Optional websocket URL
EXPO_PUBLIC_WS_URL=ws://localhost:3001
# Optional: override API/WS ports used by config if needed
EXPO_PUBLIC_API_PORT=5000
EXPO_PUBLIC_WS_PORT=3001
```

Mobile reads these in `config/api.ts`. If unset, it attempts to infer host/port during development.

### Backend (Dovio.Backend/.env)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/dovio
JWT_SECRET=replace-with-secure-random
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=replace-with-secure-random
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
# Optional CORS origins in production (comma-separated)
CORS_ORIGINS=https://your-app.com
# Optional email (if configured)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@dovio.app
```

## Common Tasks

### Run tests (backend)
```bash
cd Dovio.Backend
npm test
```

### Lint (mobile)
```bash
bun run lint
```

## Features Overview

- Auth: register, login, refresh token, verify email, forgot/reset password, 2FA (optional)
- Users: profile, wallet (balance + audit), activity, active time
- Social: posts CRUD, comments, reactions, follows, feed, search, stories, shares, notifications
- Messaging: conversations + messages
- Uploads: `POST /api/upload` (JWT protected)

Swagger UI documents endpoints: http://localhost:5000/api/docs

## Media Uploads (important)

- Endpoint: `POST /api/upload`
- Auth: Bearer JWT required
- Field: `file` in multipart/form-data
- The mobile client handles both web and native file shapes and reports progress.

If you see 401 Unauthorized on upload:
- Ensure you are logged in and email is verified
- The app now loads tokens before requests and refreshes on 401 during upload

## Auth Notes

- Registration requires email verification before login (non-test envs)
- Too many failed logins will lock the account temporarily (HTTP 423)
- Tokens: access (short), refresh (long). The mobile client auto-refreshes.

## Troubleshooting

- Upload 401: see “Media Uploads” above
- CORS (web preview): server allows all origins in development; in production set `CORS_ORIGINS`
- Mongo errors: ensure `MONGO_URI` is reachable, or run tests using in-memory DB
- Mobile can’t reach backend: set `EXPO_PUBLIC_API_BASE_URL` explicitly to your machine IP

## Scripts

Mobile (root):
- `bun run start` — start Expo dev server
- `bun run start-web` — web preview
- `bun run lint` — lint

Backend (Dovio.Backend):
- `npm run dev` — start (nodemon)
- `npm start` — start (node)
- `npm test` — run test suite

## Contributing

- Branch from `main`, open PRs with a clear description
- Include tests for backend changes when possible

## License

MIT
