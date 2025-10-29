
# DevSync — Real-Time Team Collaboration Platform (TypeScript)

**Full-stack TypeScript project** showcasing an end-to-end, production-style architecture:
- **Frontend:** React + TypeScript + Vite + Tailwind + Zustand + React Router
- **Backend:** Node.js (Express) + TypeScript + Socket.IO + PostgreSQL (Prisma)
- **Auth:** JWT (access) with bcrypt hashing
- **Realtime:** WebSockets (Socket.IO) for chat/activity stream
- **Deployment:** Docker Compose for backend + DB; Vercel-friendly frontend
- **Styling:** Tailwind with modern, glassmorphism-esque UI

> Demo credentials after seeding:  
> **email:** `demo@devsync.app` — **password:** `DevSync123!`

---

## Quick Start

### 1) Backend (API + DB)

```bash
# in the server folder
cd server

# copy env and adjust if needed
cp .env.example .env

# start Postgres via docker compose (from root or server)
docker compose up -d db

# install deps
npm install

# generate Prisma client & migrate + seed
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# run the API (http://localhost:5000)
npm run dev
```

> If you want to run API and DB together:
```bash
# from repo root
docker compose up -d
```

### 2) Frontend (Vite React)

```bash
cd client
npm install
npm run dev
# Vite will print a local dev URL, typically http://localhost:5173
```

Open the app, log in with the demo credentials, and explore Projects, Kanban board, and Chat.

---

## Project Structure
```
devsync/
 ├── server/             # Node + TS + Prisma + Socket.IO
 ├── client/             # React + TS + Vite + Tailwind + Zustand
 ├── docker-compose.yml  # API + Postgres
 └── README.md
```

## Notes
- The API URL defaults to `http://localhost:5000` (configure `VITE_API_URL` in `client/.env`).
- Prisma schema defines `User`, `Project`, `Member`, `Task`, and `Message`.
- Seed script creates one demo user, one project with tasks, and a few messages.
- Socket.IO handles project room join + new message broadcasting.

Enjoy building! ✨
