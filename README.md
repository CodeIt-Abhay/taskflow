# ◈ TaskFlow — Team Task Manager

> Full-stack role-based task management app built with React, Node.js, Express, PostgreSQL (Prisma) and deployed on Railway.

---

## 🔗 Live Demo

| Service | URL |
|---------|-----|
| Frontend | `https://efficient-surprise-production-cf10.up.railway.app/` |
| Backend API | `https://taskflow-production-a1cb.up.railway.app/` |
| Health Check | `https://taskflow-production-a1cb.up.railway.app//health` |

**Demo Credentials**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Member | member@demo.com | member123 |
| Member | morgan@demo.com | pass123 |

---

## 🚀 Features

### Authentication
- JWT-based signup / login with bcrypt password hashing
- Role selection at registration: **Admin** or **Member**
- Persistent login via localStorage token
- Protected routes — unauthenticated users redirect to login

### Role-Based Access Control
| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Delete own project | ✅ | ❌ |
| Create task | ✅ | ❌ |
| Edit / delete any task | ✅ | ❌ |
| Update status of assigned task | ✅ | ✅ |
| View projects they're part of | ✅ | ✅ |
| View team page | ✅ | ✅ |

### Project Management
- Create projects with name, description, and team members
- Admins can delete their own projects (cascades to tasks)
- Progress bar per project (% tasks done)
- Overdue task count per project

### Task Management
- Create tasks with title, description, project, assignee, status, priority, due date
- Filter by project / status / assignee
- Overdue detection (highlighted in red)
- Priority levels: High / Medium / Low
- Status: Todo / In Progress / Done

### Dashboard
- Stats: Total tasks, In Progress, Completed, Overdue
- "My Tasks" panel
- "Overdue Tasks" panel (all team tasks)
- Per-project progress bars

### Team Page
- All workspace members with task/done/overdue breakdown per person

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (Railway plugin)
- **Auth**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Security**: Helmet, CORS

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Plain inline styles (no CSS framework dependency)
- **HTTP**: Native `fetch` with JWT bearer tokens
- **Build**: Vite

### Deployment
- **Platform**: Railway
- **Database**: Railway PostgreSQL plugin
- **Repos**: Two Railway services (backend + frontend)

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema (User, Project, Task)
│   │   └── seed.js             # Demo data seed
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /api/auth/register|login
│   │   │   ├── users.js        # GET  /api/users, /api/users/me
│   │   │   ├── projects.js     # CRUD /api/projects
│   │   │   └── tasks.js        # CRUD /api/tasks
│   │   └── index.js            # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
├── frontend/
│   ├── src/
│   │   ├── api.js              # API client (fetch wrapper)
│   │   ├── App.jsx             # Full app: Auth, Dashboard, Projects, Tasks, Team
│   │   └── main.jsx            # React DOM entry
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
├── .gitignore
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (local) **or** use a free Railway project for DB

---

### 1. Clone & install

```bash
git clone https://github.com/CodeIt-Abhay/team-task-manager.git
cd team-task-manager
```

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

### 2. Configure environment

**Backend** — copy and fill in:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskmanager"
JWT_SECRET="your-super-secret-key-at-least-64-chars-long-replace-this"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

**Frontend** — for local dev, leave `VITE_API_URL` empty (Vite proxies `/api` to port 3001):
```bash
cd frontend
cp .env.example .env
# VITE_API_URL= (leave empty)
```

---

### 3. Set up the database

```bash
cd backend

# Push schema to DB
npm run db:push

# Seed demo data
npm run db:seed
```

---

### 4. Run both servers

In two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

Open `http://localhost:5173` and log in with demo credentials.

---

## 🚂 Railway Deployment Guide

### Step 1 — Create Railway project

1. Go to [railway.app](https://railway.app) → New Project
2. Choose **Empty Project**

---

### Step 2 — Add PostgreSQL

1. In your project → **+ New** → **Database** → **PostgreSQL**
2. Railway creates the DB and sets `DATABASE_URL` automatically

---

### Step 3 — Deploy Backend

1. **+ New** → **GitHub Repo** → select your repo → choose `/backend` as root directory
2. Go to **Variables** tab, add:

```
JWT_SECRET=your-very-long-random-secret-here
FRONTEND_URL=https://YOUR-FRONTEND-URL.up.railway.app
```

3. Railway auto-runs the `railway.toml` build command:
   ```
   npm install && npx prisma generate && npx prisma db push
   ```
4. After deploy, open the backend shell (or use Railway CLI) and seed:
   ```bash
   node prisma/seed.js
   ```

---

### Step 4 — Deploy Frontend

1. **+ New** → **GitHub Repo** → select your repo → choose `/frontend` as root directory
2. Go to **Variables** tab, add:

```
VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app
```

3. Railway builds with `npm install && npm run build` and serves with `npm run preview`

---

### Step 5 — Set CORS

Go back to your **Backend service → Variables** and update:
```
FRONTEND_URL=https://YOUR-ACTUAL-FRONTEND-URL.up.railway.app
```

Redeploy the backend.

---

## 🔌 REST API Reference

### Auth
```
POST /api/auth/register    { name, email, password, role }
POST /api/auth/login       { email, password }
```

### Users
```
GET  /api/users            → All users (requires auth)
GET  /api/users/me         → Current user profile
```

### Projects
```
GET    /api/projects           → Projects user is a member of
POST   /api/projects           → Create project (Admin only)
PATCH  /api/projects/:id       → Update project (Admin + owner)
DELETE /api/projects/:id       → Delete project (Admin + owner)
```

### Tasks
```
GET    /api/tasks              → Tasks in user's projects
POST   /api/tasks              → Create task (Admin only)
PUT    /api/tasks/:id          → Update task (Admin: all fields; Member: status only)
DELETE /api/tasks/:id          → Delete task (Admin only)
```

All protected routes require:
```
Authorization: Bearer <token>
```

---

## 🗄 Database Schema

```
User
  id, name, email, password, role (Admin|Member), avatar, createdAt, updatedAt
  → ownedProjects (1:many)
  → memberProjects (many:many)
  → assignedTasks (1:many)

Project
  id, name, description, ownerId, createdAt, updatedAt
  → owner (User)
  → members (many:many User)
  → tasks (1:many)

Task
  id, title, description, status (Todo|In Progress|Done)
  priority (High|Medium|Low), dueDate, projectId, assigneeId
  createdAt, updatedAt
```

---

## 🧪 Testing the API manually

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"Admin"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'

# Get projects (use token from login)
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📽 Demo Video Script (2–5 min)

1. **Login** as Admin → show Dashboard (stats, overdue, projects)
2. **Create a Project** → add team members
3. **Create Tasks** → assign, set priority & due date
4. **Switch to Member account** → show restricted UI (no create/delete)
5. **Update task status** as Member
6. **Team page** → member stats
7. Show **live Railway URL** in browser

---

## 👤 Author

Built for the Candidate Nomination Assessment — Full Stack Assignment.

- GitHub: [github.com/CodeIt-Abhay](https://github.com/CodeIt-Abhay)
- Live URL: [taskflow-frontend.up.railway.app](https://efficient-surprise-production-cf10.up.railway.app/)
