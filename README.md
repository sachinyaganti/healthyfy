# 🌱 Healthyfy
<div align="center">
Your Agentic AI Partner for Personalized Wellness & Lifestyle Support

An **Agentic Machine Learning System** applied to the **Healthcare & Fitness domain**  
(*Strictly non-clinical wellness & lifestyle support*)

<br/>

<div align="center">
  <a href="https://healthyfy-ai.netlify.app/login" target="_blank">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Healthyfy-2ecc71?style=for-the-badge&logo=netlify&logoColor=white"/>
  </a>
  &nbsp;&nbsp;
  <a href="https://youtu.be/DUPmAD7GN4s?si=I0UUS0XRvbQHCh52" target="_blank">
    <img src="https://img.shields.io/badge/▶️%20YouTube%20Demo-Watch%20Video-FF0000?style=for-the-badge&logo=youtube&logoColor=white"/>
  </a>
</div>


<br/><br/>

</div>

---

## 📌 Overview

<div align="center">

Healthyfy is a **working agentic AI prototype** that demonstrates how modern  
**agent-based systems** can reason, plan, and adapt autonomously to support:

🏃 Fitness • 🥗 Nutrition • 🧘 Mental Wellness • ❤️ Chronic Lifestyle Support

</div>

> ⚠️ **Disclaimer:** Healthyfy provides **wellness and lifestyle guidance only**.  
> It does **NOT** diagnose, treat, prescribe, or replace professional medical advice.

---

## 🧠 Why Healthyfy is an *Agentic ML System*

<div align="center">

| Capability | Description |
|-----------|-------------|
| 🧭 Decision Logic | Intelligent routing with safety guardrails |
| 🔁 Agentic Planning | Goal creation + adaptive check-in loops |
| 📈 Machine Learning | Lightweight forecasting endpoint |
| 💬 LLM Integration | Optional hosted or offline deterministic mode |
| 🛡️ Guardrails | Enforced non-medical constraints |

</div>

---

## 🏗️ System Architecture

<div align="center">
  <img src="https://github.com/user-attachments/assets/7fa6f0ae-49d6-4219-846a-06403c0b0ff8" width="45%" />
  <img src="https://github.com/user-attachments/assets/8951c6d7-1485-4346-a3ed-0a479f1b730d" width="45%" />
</div>

**High-level flow:**

1️⃣ User interacts with the React UI  
2️⃣ Requests routed through backend orchestrator  
3️⃣ Domain agents handle tasks (fitness, nutrition, mental, chronic)  
4️⃣ Safety rules enforce non-clinical responses  
5️⃣ Optional ML / Retrieval / LLM components enhance outputs  

---

## 🛠️ Technology Stack

<div align="center">

### 🎨 Frontend
<img src="https://skillicons.dev/icons?i=react,vite,tailwind,ts" />

<br/><br/>

### ⚙️ Backend
<img src="https://skillicons.dev/icons?i=python,fastapi" />

<br/><br/>

### 🗄️ Data & ML
<img src="https://skillicons.dev/icons?i=mysql,docker" />

<br/><br/>

</div>

---

## ✨ Key Features

<div align="center">

| Feature | Description |
|------|------------|
| 📊 Unified Dashboard | All wellness domains in one place |
| 📝 Local Logging | Fast, privacy-friendly (localStorage) |
| ⚡ AI Quick Suggestions | One-click AI-powered guidance |
| 🎯 Goal Coach | Multi-step planning & adaptation |
| 🔎 Knowledge Retrieval | Wellness document search |
| 📈 ML Forecasting | Simple explainable predictions |

</div>

---

## 🔁 Example User Flows

### 🧪 Flow 1 — Login & Dashboard
- Demo auth (frontend-only)
- Access unified wellness dashboard

### ⚡ Flow 2 — AI Quick Suggestions
- Fitness plan
- Nutrition guidance
- Breathing exercise
- Journal prompts

### 🎯 Flow 3 — Goal Coach Loop
1. Create a wellness goal  
2. Receive a structured plan  
3. Submit periodic check-ins  
4. Plan adapts automatically  

---

## 📡 Core API Endpoints

<div align="center">

| Endpoint | Purpose |
|--------|--------|
| `GET /health` | Service health check |
| `POST /api/chat` | Agentic chatbot |
| `POST /api/fitness/plan` | Fitness guidance |
| `POST /api/nutrition/plan` | Nutrition guidance |
| `POST /api/mental/breathing` | Guided breathing |
| `POST /api/chronic/support` | Lifestyle support |
| `POST /api/ml/forecast` | ML prediction |
| `POST /api/coach/goal` | Create goal plan |
| `POST /api/coach/checkin` | Adaptive updates |

</div>

---

## 🗂️ Repository Structure

```text
healthyfy/
├── frontend/        # React + Vite application
├── backend/         # FastAPI backend (agentic logic)
├── data/            # Coach plans & retrieval cache
├── docker-compose.yml
└── README.md
```

<br>

▶️ Running Locally (Development)

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



⚠️ Limitations

🔐 Frontend-only authentication

🏥 Non-medical scope (by design)

🗄️ Full backend persistence
