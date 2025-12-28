# Healthyfy

Healthyfy is an **agentic ML system applied to the healthcare and fitness domain** (non-clinical), delivered as a **non-medical wellness & lifestyle support platform** with:


<p align="center">
  <img src="https://github.com/user-attachments/assets/7fa6f0ae-49d6-4219-846a-06403c0b0ff8" width="48%" />
  <img src="https://github.com/user-attachments/assets/ad7be33f-bf9e-41df-bc58-b20b337d9fed" width="48%" />
</p>
<br>


<div align="center">

<h1>🌱 Healthyfy</h1>
<h3>Your Agentic AI Partner for Personalized Wellness & Lifestyle Support</h3>

<a href="https://healthyfy-ai.netlify.app/login" target="_blank">
  <img src="https://img.shields.io/badge/LIVE%20DEMO-CLICK%20HERE-2ecc71?style=for-the-badge&logo=netlify&logoColor=white" />
</a>

</div>
<br>
<br>

<img width="1919" height="1000" alt="image" src="https://github.com/user-attachments/assets/8951c6d7-1485-4346-a3ed-0a479f1b730d" /><br>

- A Vite/React frontend for daily logging, dashboards, and a floating chatbot
- A FastAPI backend that provides “AI-style” coaching endpoints (with safety guardrails)
- Optional MySQL persistence (SQLAlchemy) and local retrieval (FAISS or a Windows-safe fallback)

**Disclaimer (important):** Healthyfy provides wellness and lifestyle support only. It does **not** diagnose, treat, prescribe, or replace professional medical advice.

## Why this is an “agentic ML system”

Healthyfy is designed around an **agentic backend**: user requests are routed through an orchestrator, guarded by safety rules, and handled by specialized “domain agents” (fitness, nutrition, mental wellness, chronic support, and goal coaching). The system combines:

- **Decision logic** (routing + safety guardrails)
- **Agentic planning/autonomy** (Goal Coach plan generation + iterative check-ins)
- **ML** (a lightweight forecasting endpoint)
- **LLM integration (optional)** via a pluggable client (can run offline)

This is intentionally scoped to wellness and fitness support rather than clinical decision-making.

## What the system does (functionality)

- **Unified wellness dashboard**: fitness, nutrition, mental wellness, and chronic-support tracking in one place.
- **Local logging + insights**: most user logs are stored in the browser (localStorage) and summarized into small “insights”.
- **AI quick suggestions**: one-click calls to backend endpoints for:
	- Fitness plan suggestions
	- Nutrition plan suggestions
	- Guided breathing session text
	- Journal prompts
	- Chronic-condition support suggestions
- **Goal Coach loop**: create a goal plan, then submit periodic check-ins to adapt it.
- **Wellness retrieval**: retrieve relevant snippets from seed wellness documents (FAISS when available; deterministic fallback on Windows).

## System assumptions

- **Not medical**: responses are constrained to non-medical lifestyle guidance; guardrails should redirect medical questions.
- **Auth is frontend-only**: login/register is implemented client-side (localStorage). The backend does not validate sessions/tokens.
- **User data storage**:
	- Primary: browser localStorage for most logs and the “session”.
	- Coach plans: persisted as JSON (defaults to `data/coach_plans.json`).
	- Database: MySQL is optional for dev; the backend will still start if DB isn’t available (DB initialization is skipped).
- **Vector search on Windows**: FAISS may be unavailable locally. In that case, retrieval uses a deterministic embedding fallback (runnable everywhere, but less semantically accurate).

## Tech stack

- Frontend: Vite + React, Tailwind CSS, Framer Motion
- Backend: Python 3.10+, FastAPI, Uvicorn, Pydantic
- DB: MySQL (SQLAlchemy + PyMySQL)
- Retrieval: FAISS (when available) + local fallback on Windows

## Repo structure

- `frontend/` — React app
- `backend/` — FastAPI app
- `docker-compose.yml` — MySQL + backend container (dev)

## How to run (local development)

You have two supported ways to run the app locally.

### Option A — Run using VS Code Tasks (this matches what you just did)

This is the easiest path if you already have a Python venv set up and Node dependencies installed.

1) Start the backend task: **`backend:dev`**

- Runs Uvicorn with:
	- Host: `127.0.0.1`
	- Port: `8004`
	- App dir: `backend/`
- Sets these env vars for you:
	- `DATABASE_URL=mysql+pymysql://healthyfy:healthyfy@127.0.0.1:3306/healthyfy`
	- `COACH_DATA_DIR=<repo>/data`

2) Start the frontend task: **`frontend:dev`**

- Runs Vite with:
	- Host: `127.0.0.1`
	- Port: `5173`
- Sets `VITE_API_BASE=http://127.0.0.1:8004` so the frontend talks to the backend task.

3) Open the app:

- Frontend: `http://127.0.0.1:5173/`
- Backend health: `http://127.0.0.1:8004/health`
- Backend API docs: `http://127.0.0.1:8004/docs`

If MySQL isn’t running, the backend still starts, but DB-backed features may be limited.

## Implementation notes (prototype / demo / workflow)

This repository contains a working prototype with an executable workflow:

- **Frontend demo**: open `http://127.0.0.1:5173/` and use the unified dashboard + chatbot UI.
- **Backend demo**: open `http://127.0.0.1:8004/docs` to run endpoints interactively.

Suggested demo script (end-to-end):

1) Start backend + frontend (Option A above).
2) In the UI, register/login (demo auth) and open the Unified Dashboard.
3) Trigger **AI quick suggestions** (fitness/nutrition/breathing/journal/chronic) to demonstrate agent routing to domain endpoints.
4) Create a **Goal Coach** plan, then submit one or more check-ins to demonstrate autonomous plan adaptation over time.
5) (Optional) Call wellness retrieval (`/api/wellness/retrieve`) to demonstrate knowledge retrieval over seed docs.
6) (Optional) Call ML forecast (`/api/ml/forecast`) to demonstrate a simple predictive model endpoint.

## ML models, LLMs, and decision logic

- **ML model (forecasting):** `POST /api/ml/forecast` implements a simple time-series trend forecast (lightweight regression-style approach). It’s intentionally simple to keep the prototype runnable and explainable.
- **LLM usage (optional):** the backend supports calling a hosted LLM through a dedicated client. If no API key is configured, the system operates in a deterministic/offline mode.
- **Decision logic:** safety guardrails and orchestrator routing determine which domain agent/endpoint should handle a request and enforce non-medical constraints.

## Agentic reasoning, planning, and autonomy (what is demonstrated)

- **Orchestrated agent routing:** chat and “quick suggestion” actions are handled by domain-specific capabilities rather than a single monolithic prompt.
- **Planning loop:** Goal Coach creates a structured plan and then updates/adapts it based on follow-up check-ins (a minimal example of autonomous behavior over time).
- **Guardrails-first behavior:** safety logic restricts outputs to wellness guidance and steers away from clinical diagnosis/treatment.

### Option B — Run with Docker Compose (MySQL + backend)

From the repo root:

```bash
docker compose up --build
```

- Backend: `http://localhost:8000`
- Health: `http://localhost:8000/health`

Then run the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

Frontend default is `http://localhost:5173` and will call `http://localhost:8000` unless you override `VITE_API_BASE`.

## Environment variables

### Backend

- `DATABASE_URL` — MySQL connection string
- `CORS_ORIGINS` — comma-separated allowed origins (defaults to `http://localhost:5173` and `http://127.0.0.1:5173` in dev)
- `VECTOR_DATA_DIR` — where the vector index + metadata live (defaults to `./data`)
- `COACH_DATA_DIR` — where coach state is written (defaults to repo-root `data/`)

Optional hosted LLM configuration:

- `LLM_API_KEY` (required to enable hosted LLM)
- `LLM_BASE_URL` (default `https://api.openai.com/v1`)
- `LLM_MODEL` (default `gpt-4o-mini`)

If `LLM_API_KEY` is not set, Healthyfy runs in an **offline/deterministic mode**.

### Frontend

- `VITE_API_BASE` — backend base URL (defaults to `http://localhost:8000`)

PowerShell example:

```powershell
$env:VITE_API_BASE = "http://127.0.0.1:8004"
```

## Example interaction flows

### Flow 1 — Login/Register (demo auth)

1) Open the frontend and create a user in the Register page.
2) Login; the session is stored in localStorage.
3) Navigate to the Unified Dashboard.

### Flow 2 — Daily tracking → insights

1) Log items (meals, water, mood, workouts, symptoms, reminders).
2) View domain dashboards and the unified dashboard KPIs.
3) Insights update immediately because the data is localStorage-backed.

### Flow 3 — “AI quick suggestions”

1) In the Unified Dashboard, choose an action (fitness plan / nutrition plan / breathing / journal / chronic support).
2) The frontend calls the backend (e.g., `/api/fitness/plan`).
3) The backend returns structured guidance and the UI displays it.

### Flow 4 — Goal Coach plan + check-ins

1) Create a goal plan (e.g., “walk 30 min daily for 7 days”).
2) Receive a plan ID.
3) Submit check-ins with adherence and notes; the backend updates the plan.
4) The plan state persists to JSON in `data/coach_plans.json` by default.

## Key API endpoints

- `GET /health`
- `POST /api/chat` — orchestrated chatbot (guardrails + domain agents)
- `POST /api/fitness/plan`
- `POST /api/nutrition/plan`
- `POST /api/mental/breathing`
- `GET /api/mental/journal-prompt`
- `POST /api/chronic/support`
- `POST /api/wellness/retrieve` — retrieval over seed wellness docs
- `POST /api/ml/forecast` — simple trend forecast (linear regression)
- `POST /api/coach/goal` — create a goal plan
- `POST /api/coach/checkin` — submit a check-in
- `GET /api/coach/state/{plan_id}` — fetch persisted plan state

## Limitations

- **Security/auth**: frontend-only auth (localStorage) is not production-safe; backend does not enforce identity.
- **Medical scope**: intentionally constrained to wellness guidance; not a clinical tool.
- **Vector search quality on Windows**: deterministic fallback is runnable but less semantically accurate than real embeddings/FAISS.
- **Persistence model**: much of the user data is local to the browser; clearing storage clears most history.
- **Single-node architecture**: local file persistence (coach JSON, vector cache) isn’t shared across instances.

## Future improvements

- Replace demo auth with real authentication (server-issued sessions/JWT, password reset, RBAC).
- Move logs/history to a proper backend store (per-user DB tables), add export/import.
- Add proper embeddings + hosted/vector database option (e.g., pgvector, Pinecone) for better retrieval.
- Add structured evaluation tests for guardrails and agent outputs.
- Add observability (request tracing, prompt logging with redaction, metrics).

## Deploy (high level)

- Frontend can be deployed to Netlify (see `netlify.toml`).
- Backend must be deployed separately (Render/Fly.io/Azure/App Service/etc.).
- Set `VITE_API_BASE` in the frontend environment to point to the deployed backend.
- Configure backend `CORS_ORIGINS` to include your frontend origin.
