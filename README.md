# 🎓 AlumniConnect — Full-Stack Alumni Management System

A modern, full-featured Alumni Network built with **FastAPI + React + PostgreSQL**.

![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Auth-JWT-orange?style=flat-square)

---

## 📁 Project Structure

```
alumni-system/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point, CORS, static files
│   │   ├── config.py           # Settings from environment variables
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   └── __init__.py     # User, Connection, Message, Job, Application, Notification
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   │   └── __init__.py
│   │   ├── routes/             # API route handlers
│   │   │   ├── auth.py         # Register, Login, Forgot/Reset Password
│   │   │   ├── users.py        # Profile, Dashboard, Search, File Uploads
│   │   │   ├── connections.py  # Send/Accept/Reject/List Connections
│   │   │   ├── messages.py     # REST + WebSocket Messaging
│   │   │   ├── jobs.py         # Job Portal + Applications
│   │   │   └── notifications.py
│   │   └── utils/
│   │       ├── auth.py         # JWT helpers, bcrypt, get_current_user
│   │       └── file_handler.py # Profile pic + Resume upload handlers
│   ├── uploads/                # Local file storage (auto-created)
│   │   ├── profiles/
│   │   └── resumes/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx             # Routes + Auth guards
│   │   ├── main.jsx
│   │   ├── index.css           # Global styles + Tailwind
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state
│   │   ├── services/
│   │   │   └── api.js          # Axios instance + all API calls
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Layout.jsx
│   │   │       └── Sidebar.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── ForgotPassword.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Profile.jsx
│   │       ├── UserProfile.jsx
│   │       ├── Network.jsx
│   │       ├── Messages.jsx
│   │       └── Jobs.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
└── database/
    └── init.sql                # Optional manual DB init
```

---

## 🚀 Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| npm / yarn | Latest |

---

## ⚙️ Setup Instructions

### 1. Clone & Navigate

```bash
git clone <repo-url>
cd alumni-system
```

---

### 2. PostgreSQL Database

```bash
# Start PostgreSQL and create the database
psql -U postgres
CREATE DATABASE alumni_network;
\q
```

> SQLAlchemy will **auto-create all tables** on first backend startup — no migrations needed.

---

### 3. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate          # Linux/Mac
# OR: venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/alumni_network
SECRET_KEY=your-super-secret-jwt-key-min-32-characters
FRONTEND_URL=http://localhost:5173
```

Run the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

✅ Backend running at: **http://localhost:8000**  
📚 Swagger API docs: **http://localhost:8000/api/docs**

---

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy env file (no changes needed for local dev)
cp .env.example .env

# Start development server
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/alumni_network` |
| `SECRET_KEY` | JWT signing secret (min 32 chars) | ⚠️ Must change! |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` (24h) |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `UPLOAD_DIR` | Upload folder path | `uploads` |
| `MAX_FILE_SIZE_MB` | Max upload size | `10` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend URL (leave empty if using Vite proxy) | `` |

---

## 📡 API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request reset token |
| POST | `/api/auth/reset-password` | Reset with token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/dashboard` | Dashboard statistics |
| GET | `/api/users/search?q=...` | Search alumni |
| GET | `/api/users/{id}` | View user profile |
| PUT | `/api/users/me` | Update own profile |
| POST | `/api/users/me/profile-picture` | Upload profile picture |
| POST | `/api/users/me/resume` | Upload resume |

### Connections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connections/request` | Send connection request |
| PUT | `/api/connections/{id}/respond` | Accept or reject |
| GET | `/api/connections/pending` | Incoming pending requests |
| GET | `/api/connections/my-connections` | Accepted connections |
| DELETE | `/api/connections/{id}` | Remove connection |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/send` | Send message (REST) |
| GET | `/api/messages/conversations` | All conversation summaries |
| GET | `/api/messages/conversation/{userId}` | Fetch chat history |
| WS | `/api/messages/ws/{token}` | Real-time WebSocket chat |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/` | List jobs (with filters) |
| POST | `/api/jobs/` | Post a new job |
| GET | `/api/jobs/{id}` | Get single job |
| PUT | `/api/jobs/{id}` | Update job (poster only) |
| DELETE | `/api/jobs/{id}` | Delete job |
| POST | `/api/jobs/{id}/apply` | Apply for a job |
| GET | `/api/jobs/{id}/applicants` | View applicants (poster only) |
| GET | `/api/jobs/my-applications/list` | My submitted applications |

---

## 🗄️ Database Schema

### Tables
- **users** — Core user accounts with profile fields, file paths
- **connections** — User-to-user connection requests with status (`pending`/`accepted`/`rejected`)
- **messages** — One-to-one messages with read tracking
- **jobs** — Job postings with type, deadline, requirements
- **applications** — Job applications linking users to jobs
- **notifications** — In-app notifications for events

### Relationships
```
users ──< connections (as requester)
users ──< connections (as receiver)
users ──< messages (as sender)
users ──< messages (as receiver)
users ──< jobs (as poster)
users ──< applications (as applicant)
jobs ──< applications
users ──< notifications
```

---

## ✨ Features

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| User Registration & Login | ✅ |
| Forgot/Reset Password | ✅ |
| Profile with Picture & Resume Upload | ✅ |
| Connection System (LinkedIn-style) | ✅ |
| Real-time WebSocket Messaging | ✅ |
| REST Messaging (fallback) | ✅ |
| Job Portal (post, search, apply) | ✅ |
| View Applicants | ✅ |
| In-app Notifications | ✅ |
| User Search (name, skills, course) | ✅ |
| Dashboard with Statistics | ✅ |
| Pagination on Jobs & Messages | ✅ |
| Responsive Design | ✅ |
| Collapsible Sidebar | ✅ |

---

## 🏗️ Production Deployment

### Backend
```bash
# Use gunicorn with uvicorn workers
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
npm run build       # Outputs to dist/
# Serve with Nginx, Vercel, Netlify, etc.
```

### Environment Checklist
- [ ] Set a strong `SECRET_KEY` (32+ random characters)
- [ ] Use a proper PostgreSQL password
- [ ] Set `DEBUG=False`
- [ ] Configure SMTP for real email password resets
- [ ] Consider AWS S3 / Cloudinary for file uploads in production
- [ ] Set `FRONTEND_URL` to your production domain

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, Alembic |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | PostgreSQL, psycopg2 |
| Real-time | WebSockets (built into FastAPI) |
| Frontend | React 18, React Router v6 |
| Styling | Tailwind CSS v3 |
| HTTP Client | Axios |
| Build Tool | Vite |
| Icons | Lucide React |

---

## 📝 Notes

- **File uploads** are stored locally in `backend/uploads/`. For production, integrate AWS S3 or Cloudinary.
- **Forgot password** returns the token in the API response in dev mode. Configure SMTP to send real emails.
- **WebSocket** falls back to REST automatically if the WS connection fails.

---

*Built with ❤️ — AlumniConnect v1.0*
