## 📛 Badges

![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Backend-Node.js-3C873A?logo=node.js)
![Express](https://img.shields.io/badge/API-Express-black?logo=express)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socketdotio)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-0064a5?logo=postgresql)
![Prisma](https://img.shields.io/badge/ORM-Prisma-0c344b?logo=prisma)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Tailwind](https://img.shields.io/badge/UI-TailwindCSS-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)


#  DevSync — Real-Time Team Project Manager

DevSync is a collaborative project management tool with real-time messaging and drag-and-drop task boards — similar to Trello & Notion teamwork.

It supports roles, multi-user access, task workflow, and live collaboration using WebSockets.

> Built as a full-stack portfolio project to demonstrate real-world engineering skills.

### 🌐 Live Demo
https://dev-sync-mu.vercel.app/

##  Features

### - Project & Team Management
- Create & delete projects
- Invite team members by email
- Role-based permissions: Owner / Admin / Member / Viewer
- Remove users or change roles

### - Real-Time Kanban Board
- Drag & drop tasks between To-Do / In-Progress / Done
- Live updates for all active users
- Create, edit, delete tasks

### - Real-Time Chat
- Project-based chat rooms
- Instant messaging using Socket.io

### - Authentication & Security
- JWT authentication
- Protected API routes
- Prisma schema validation

### - Backend Sleep Handling
- Wake-screen overlay for free backend hosting
- Auto connects once API wakes up

##  Tech Stack

### Frontend
- React + Vite
- TypeScript
- Tailwind CSS
- Zustand
- SWR
- Socket.io client
- Kanban drag & drop

### Backend
- Node.js + Express
- PostgreSQL
- Prisma ORM
- Socket.io
- JWT auth
- Docker support

## Quick Start

### 1) Backend (API + DB)

```bash
# in the server folder
cd server

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
```

## 🛡️ Roles & Permissions

| Action | Owner | Admin | Member | Viewer |
|-------|------|-------|--------|--------|
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Edit tasks   | ✅ | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ | ❌ |
| Manage roles | ✅ | ✅ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ | ❌ |

