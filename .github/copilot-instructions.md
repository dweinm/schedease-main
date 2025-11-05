# Copilot instructions for SchedEase

Purpose: Short, actionable repo-specific guidance so an AI agent can be productive immediately.

Big picture
- Monorepo with two runtime halves:
  - backend/: Node (ES modules) + Express + MongoDB (Mongoose). Entry: `backend/server.js`.
  - frontend/: React + TypeScript + Vite. Entry: `frontend/src/main.tsx` and `src/App.tsx`.
- All API routes are mounted under `/api/*` in `backend/server.js`. Frontend client hits `/api` (dev base: `http://localhost:3001/api`).

Quick developer workflows (commands you will use)
- Install deps (root): `npm run install:all` (see root `package.json`).
- Start backend: `cd backend; npm run dev` (calls `backend/scripts/start-dev.js` which runs `node server.js`).
- Start frontend: `cd frontend; npm run dev` (Vite).
- Start both: `npm run dev:both` from repo root (uses `concurrently`).
- Initialize DB + seed: `cd backend; npm run setup-db` (calls `initializeDatabase()` and `seedDatabase()` in `backend/config/database.js`).

Authentication & tokens
- JWT implementation: `backend/utils/auth.js`. Use env `JWT_SECRET` and `TOKEN_EXPIRATION_HOURS`.
- Middleware: `requireAuth` / `requireAdmin` live in `backend/api/auth.js` — reuse them for protected routes.
- Frontend stores token in `localStorage` under `authToken`. See `frontend/src/lib/api.ts` and `frontend/src/components/AuthContext.tsx` for how token is attached to requests.

Data models & important server patterns
- Models and exports are centralized in `backend/config/database.js` (User, Course, Room, Schedule, Instructor, Student).
- Many schedule endpoints use `checkScheduleConflicts()` in `backend/api/schedules.js`. Keep that intact when editing schedule logic.
- Use Mongoose `populate()` in schedule endpoints to return rich, nested objects (courses, rooms, instructor.user).

Conventions you must preserve (don't change lightly)
- API response shape: always return JSON with at least `{ success: boolean, ... }` — frontend relies on `response.success`.
- Error handling: endpoints return `{ success: false, message }` with appropriate HTTP status codes (400/401/403/404/500).
- Backend uses ES modules (`import`/`export`). Don't introduce CommonJS.

Adding routes or models — checklist
1. Add route file under `backend/api/` and export a router.
2. Mount it in `backend/server.js` with the other `/api` routes.
3. If you add a model, export it from `backend/config/database.js` so seeds and other modules can import it.
4. Preserve response shape and populate patterns. Add unit/manual checks for `checkScheduleConflicts()` if schedule-related.

Key files to inspect
- `backend/server.js` — route mounts, middleware, CORS.
- `backend/config/database.js` — models, connection and seeding.
- `backend/api/*.js` — route handlers (auth, users, schedules, rooms, courses, settings).
- `backend/utils/auth.js` — token helpers and password hashing.
- `backend/scripts/setup-database.js` and `start-dev.js` — developer helper scripts.
- `frontend/src/lib/api.ts`, `frontend/src/components/AuthContext.tsx` — client base URL and token handling.

Env & runtime notes
- Default MongoDB URI fallback: `mongodb://localhost:27017/schedease_db` unless `MONGODB_URI` is set.
- Toggle seeding with `SEED_DATABASE=true` when running setup.
- Backend dev port used by frontend fallback: `3001` (so frontend uses `http://localhost:3001/api` if not otherwise configured).

Debugging tips
- If frontend fails to reach backend, confirm `AuthContext` base URL in `frontend/src/components/AuthContext.tsx` and `CORS_ORIGINS` in backend env.
- Run the backend with `node server.js` or `npm run dev` to see `initializeDatabase()` logs when connecting/seeding.

If a section needs more examples (e.g., adding a sample API route end-to-end), tell me which part to expand and I will add a short code + test example.