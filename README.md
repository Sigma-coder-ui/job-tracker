# Job Tracker (FastAPI + Next.js)

A full-stack app to track job applications. Sign up, add jobs, move them from **Applied** to **Offer**, search, filter and see live counts.

## Features
- JWT login with hashed passwords (bcrypt)
- Add, edit, delete jobs (REST API)
- Search by company or role, filter by status
- Dashboard with status counts
- Each user sees only their own jobs
- Auto API docs at `/docs`

## Tech
**Backend:** Python, FastAPI, SQLAlchemy, SQLite, Pydantic, PyJWT
**Frontend:** Next.js 14 (App Router), React

## Run locally
**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API: http://localhost:8000 · Docs: http://localhost:8000/docs

**Frontend** (new terminal)
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
App: http://localhost:3000

## API
| Method | Endpoint | What it does |
|---|---|---|
| POST | /auth/register | Create account |
| POST | /auth/login | Get JWT token |
| GET | /jobs?q=&status= | List, search, filter |
| GET | /jobs/stats | Count per status |
| POST | /jobs | Add job |
| PUT | /jobs/{id} | Edit job |
| DELETE | /jobs/{id} | Delete job |

## Deploy
- **Backend (Render):** root `backend`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set env `SECRET_KEY` and `FRONTEND_URL` (your Vercel URL).
- **Frontend (Vercel):** root `frontend`, set env `NEXT_PUBLIC_API_URL` to your Render URL.
- Note: Render's free disk resets, so use a free PostgreSQL and set `DATABASE_URL` (add `psycopg2-binary` to requirements).
