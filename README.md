# Job Portal with AI-Based Resume Screening
B.Tech Mini Project - React + Node/Express + MongoDB + Python (spaCy NLP)

## Folder structure
```
Job-Portal-AI/
├── backend/      Node.js + Express API (port 5000)
├── ai-service/   Python Flask NLP service (port 8000)
└── frontend/     React + Vite app (port 5173)
```

## Prerequisites (install once)
| Tool | Version | Check with |
|---|---|---|
| Node.js | 18 or newer | `node -v` |
| Python | 3.10 or newer | `python --version` |
| MongoDB | Community Server (local) OR a free MongoDB Atlas cluster | `mongod --version` |

## How to run (open 3 terminals in VS Code)

### Terminal 1 - Backend
```bash
cd backend
npm install
copy .env.example .env        # Windows   (Mac/Linux: cp .env.example .env)
npm run dev
```
Expected: `Backend running on http://localhost:5000`

### Terminal 2 - AI service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate         # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python -m spacy download en_core_web_sm     # optional but recommended
python app.py
```
Expected: `Running on http://127.0.0.1:8000`
(Quick test without the server: `python test_nlp.py`)

### Terminal 3 - Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in Chrome.

## MongoDB setup
**Option A - Local:** install MongoDB Community Server (keep "Install as a Service" ticked). The default
`MONGO_URI=mongodb://127.0.0.1:27017/job_portal_ai` in `.env` then works with no changes.

**Option B - Atlas (cloud, as in the synopsis):** create a free cluster -> Database Access (create user) ->
Network Access (allow your IP) -> Connect -> Drivers -> copy the URI and paste it in `backend/.env`:
`MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/job_portal_ai`

## Demo flow
1. Register a **Recruiter** -> Post a job with skills e.g. `Python, Django, SQL, Git`.
2. Logout -> Register an **Applicant** -> search for the job -> **Upload Resume & Apply** (PDF / DOCX / TXT).
3. Applicant sees the AI match %, matched skills and missing skills under *My Applications*.
4. Login as the recruiter -> **View Applicants** -> ranked list by match score -> set *Shortlisted / Rejected*.

## How the AI scoring works
1. Text is extracted from the resume (pdf-parse for PDF, mammoth for DOCX).
2. Python service tokenizes it (spaCy), extracts skills from a skill dictionary.
3. Each skill required by the recruiter is searched in the resume -> **skill score**.
4. TF-IDF **cosine similarity** between resume and job description -> **similarity score**.
5. Final match % = 70% skill score + 30% similarity.
If the Python service is not running, the backend automatically falls back to a simple keyword matcher.

## Troubleshooting
| Problem | Fix |
|---|---|
| `MongoDB connection failed` | MongoDB service not running, or wrong `MONGO_URI` / Atlas IP not whitelisted |
| `Could not read text from this resume` | PDF is a scanned image; use a text-based PDF/DOCX |
| Frontend shows network error | Backend not running on port 5000 |
| `pip install spacy` fails | Use Python 3.10-3.12; or remove `spacy` from requirements.txt (the code still works without it) |
| Port already in use | Change `PORT` in `backend/.env` and `API` in `frontend/src/main.jsx` |
