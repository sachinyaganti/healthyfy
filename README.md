# Healthyfy

Healthyfy is a **non-medical wellness & lifestyle support platform**.

**Disclaimer:** Healthyfy provides wellness and lifestyle support only. It does **NOT** diagnose, treat, or replace professional medical advice.

## Tech Stack

- Frontend: Vite + React, Tailwind CSS, Framer Motion, floating chatbot
- Backend: Python 3.10+, FastAPI, Uvicorn, Pydantic
- DB: MySQL (via SQLAlchemy ORM)
- Vector DB: FAISS (local index for retrieval)
- AI: Hosted LLM (abstracted via backend service layer) + tool-style orchestration + rule-based guardrails

## Folder Structure

- frontend/
- backend/
- docker-compose.yml

## Running (Dev)

### 1) Start MySQL + Backend

From the repo root:

```bash
docker compose up --build
```

Backend runs at:
- http://localhost:8000
- Health check: http://localhost:8000/health

Note: If you run the backend via the VS Code task `backend:dev`, it runs on `http://127.0.0.1:8004` by default (to avoid clashing with Docker on `8000`).

### 2) Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:
- http://localhost:5173

## Environment Variables

### Backend (optional hosted LLM)

Set these on the backend container (docker-compose.yml) or locally:

- `LLM_API_KEY` (required to enable hosted LLM)
- `LLM_BASE_URL` (default `https://api.openai.com/v1`)
- `LLM_MODEL` (default `gpt-4o-mini`)

If `LLM_API_KEY` is not set, Healthyfy runs in **offline mode** with deterministic, non-medical wellness guidance.

### Backend (local data directory)

- `VECTOR_DATA_DIR` — where the FAISS index + metadata are stored (defaults to `./data`)
- `COACH_DATA_DIR` — where Goal Coach state is stored (defaults to repo-root `data/`)

Goal Coach persists to `data/coach_plans.json` by default.

### Frontend

- `VITE_API_BASE` (default `http://localhost:8000`)

If you use the VS Code tasks (`backend:dev` + `frontend:dev`), the `frontend:dev` task sets `VITE_API_BASE` to `http://127.0.0.1:8004` automatically.

Example (PowerShell):

```powershell
$env:VITE_API_BASE="http://localhost:8000"
```

## Deploy (Netlify)

Netlify is a great fit for the **frontend** (Vite/React). The **backend** (FastAPI) must be deployed separately (e.g., Render/Fly.io/Azure/App Service/etc.) and then referenced from the frontend via `VITE_API_BASE`.

### Netlify settings

This repo includes a Netlify config at [netlify.toml](netlify.toml).

- **Base directory**: `frontend`
- **Build command**: `npm ci && npm run build`
- **Publish directory**: `frontend/dist`

### Required environment variables (Netlify)

In Netlify → Site configuration → Environment variables:

- `VITE_API_BASE` = your deployed backend URL (example: `https://healthyfy-api.yourdomain.com`)

### Backend CORS (required)

On your backend hosting, set:

- `CORS_ORIGINS` = your Netlify site origin (example: `https://your-site.netlify.app`)

You can provide multiple origins as a comma-separated list.

## Key API Endpoints

- `POST /api/chat` — agentic chat (guardrails + orchestrator + domain agents)
- `POST /api/fitness/plan`
- `POST /api/nutrition/plan`
- `POST /api/mental/breathing`
- `GET /api/mental/journal-prompt`
- `POST /api/chronic/support`
- `POST /api/wellness/retrieve` — FAISS retrieval over seed wellness docs
- `POST /api/ml/forecast` — simple ML trend forecast (linear regression)
- `POST /api/coach/goal` — create a goal plan (agent loop)
- `POST /api/coach/checkin` — check-in and adapt the plan
- `GET /api/coach/state/{plan_id}` — fetch persisted plan state

## Notes

- Healthyfy intentionally avoids medical diagnosis, prescriptions, or treatment advice.
- If users ask medical questions, the backend guardrails will redirect to professional care.
