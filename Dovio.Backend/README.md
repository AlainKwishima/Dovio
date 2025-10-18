# Mobile Backend API

A secure, modern backend for a React Native application, built with Node.js, Express, and MongoDB. It ships with JWT auth, social graph (follows, posts), messaging, wallet tracking with audit logs, comprehensive validation, rate limiting, and beautiful interactive API docs.

## ✨ Highlights
- Authentication with JWT + refresh tokens, email verification, password reset, and optional 2FA
- Users: profile, activity history, active time tracking, and wallet operations with audit logging
- Social: posts (public fetch, authenticated create/update/delete), follows with duplicate prevention
- Messaging: send, list, conversations, and delete (sender/receiver only)
- Security: Helmet, CORS with `CORS_ORIGINS`, rate limiting, input validation, NoSQL-injection sanitization, HPP
- DX: OpenAPI (Swagger UI), structured errors, in-memory MongoDB for tests, and full Jest E2E suite

## 🧩 Tech Stack
- Runtime: Node.js (ESM)
- Framework: Express.js
- Database: MongoDB via Mongoose
- Auth: `jsonwebtoken`
- Validation: `Joi`
- Security: `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `hpp`, `bcryptjs`
- Docs: Swagger UI (OpenAPI 3.1)
- Tests: Jest + Supertest + mongodb-memory-server

## 🚀 Quick Start
1) Install dependencies
```bash
npm install
```

2) Configure environment
Create a `.env` based on `env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mobile
JWT_SECRET=replace-with-secure-random
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=replace-with-secure-random
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
# Optional: comma-separated allowed origins in production
# CORS_ORIGINS=https://app.example.com,https://admin.example.com
# Optional SMTP for real mail delivery (falls back to console JSON transport)
# SMTP_HOST=...
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...
# SMTP_FROM=no-reply@mobile.app
```

3) Run the server
```bash
# Development
npm run dev
# Production
npm start
```

- Health check: `http://localhost:5000/health`
- API base: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/api/docs`

## 📚 API Documentation
Interactive docs are served by Swagger UI. The app prefers the comprehensive spec at `openapi/mobile.v1.yaml` and falls back to `src/swagger.yaml`.

- Click “Authorize” and paste your JWT as `Bearer YOUR_TOKEN` to try protected endpoints.
- Typical flow:
  - `POST /api/auth/register`
  - `POST /api/auth/login` → copy `accessToken`
  - Authorize → try users, posts, follows, messages endpoints

## 🗺️ Endpoints Overview
- Auth: register, login, refresh token, verify email, forgot/reset password, 2FA request/verify, verify-password
- Users: get/update profile, delete account, wallet update (audit logged), add activity, add active time, get activity history
- Posts: public list/read; authenticated create/update/delete
- Messages: create/list/conversations/delete (JWT)
- Follows: follow/unfollow/list followers/following/check status (JWT)
- Health & Docs

## 🛡️ Security
- Helmet for security headers
- CORS with environment-driven allowed origins
- Rate limiting for general traffic and auth endpoints
- Joi validation on inputs and queries
- `express-mongo-sanitize` and `hpp` enabled globally
- Avoids overexposing user data (e.g., emails in follows/messages lists)

## 🧪 Testing
```bash
npm test
```
- Uses an in-memory MongoDB; no external DB required
- E2E coverage for auth flows, authorization checks, duplicate follows, posts/messages permissions, Swagger docs serving

## 🗃️ Data Models (high-level)
- `User`: identity, auth state, profile, walletBalance, activity, activeTimeByDate
- `Post`: `postId`, `userId`, `content`, `timestamp` (+ indexes, virtual `author`)
- `Message`: `messageId`, `senderId`, `receiverId`, `content`, `timestamp` (+ indexes)
- `Follow`: `followerId`, `followeeId` (+ unique compound index)
- `WalletAudit`: immutable record of wallet operations

## 🔧 Scripts
```bash
npm run dev        # Start with nodemon
npm start          # Start server
npm test           # Run tests
npm run seed       # Seed DB (if implemented)
```

## 📦 Project Structure
```
src/
  config/           # configuration and database connection
  controllers/      # route handlers
  middleware/       # auth, validation, errors, rate-limiter
  models/           # mongoose models
  routes/           # express routers
  utils/            # helpers (jwt, tokens, mailer, uuid)
  server.js         # app bootstrap and wiring
openapi/
  mobile.v1.yaml    # full OpenAPI spec (preferred by Swagger UI)
```

## 🗄️ Deployment Notes
- Provide strong secrets in environment (never commit real secrets)
- Set `CORS_ORIGINS` for production
- Ensure MongoDB is reachable via `MONGO_URI`
- Optionally configure SMTP for email delivery

## 🧭 Roadmap
- Role-based permissions / ABAC
- Soft-delete for posts/messages
- WebSocket/Realtime messaging
- Audit trails for sensitive profile changes

## 🤝 Contributing
- Fork → feature branch → PR. Please include tests for changes where applicable.

## 📄 License
MIT


