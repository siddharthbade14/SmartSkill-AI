# SmartSkill AI: MoSPI / iGOT Karmayogi Micro-Learning System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED.svg?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Pro%20%2F%20Flash%20(Temp%200.0)-8E75B2.svg?logo=google&logoColor=white)](https://ai.google.dev)

SmartSkill AI is an enterprise-grade, production-ready full-stack micro-learning and assessment platform built for the **Ministry of Statistics and Programme Implementation (MoSPI)** and India's **iGOT Karmayogi** civil services capacity-building initiative.

It transforms complex statistical manuals, operational guidelines, and policy frameworks into grounded, psychometrically vetted multiple-choice assessments with **Human-in-the-Loop (HITL)** quality assurance and **personalized iGOT remediation pathways**.

---

## 🏛️ Key Capabilities

1. **Robust Multi-Tier PDF Ingestion**:
   - Extracts dense administrative text and tabular matrices from complex government publications (e.g. NSS survey instructions, National Accounts manuals) using `pypdf` and `pdfplumber`.
   - Cleans standard boilerplate headers, page footers, and redundant line-breaks.

2. **Deterministic AI Question Generation (Temperature 0.0)**:
   - Powered by LangChain and Google Gemini (`gemini-3.8-flash` / Gemini Pro) with **temperature set strictly to 0.0** to eliminate hallucinations.
   - Enforces structured Pydantic schema validation: 4 distinct options (A, B, C, D), single unambiguous correct answer, in-depth pedagogical explanation, competency domain tag, difficulty level, and page/section citation.
   - Deterministic offline fallback engine guarantees complete operational resilience in air-gapped or test environments.

3. **Admin Human-in-the-Loop (HITL) Dashboard**:
   - Curators review AI-generated questions against source manual citations before publishing.
   - Inline editing: Modify question stems, options, correct answers, difficulty, and explanations with instant save.
   - Individual and bulk approval/rejection workflows with audit logging.

4. **Real-Time Assessment & Competency Gap Diagnostics**:
   - Timed quiz-taking interface with countdown timer, question palette, and responsive state tracking.
   - Instant scoring with granular competency breakdown (e.g. *Sampling Frame & Design*, *National Accounts Statistics*, *Data Quality Control*).
   - Classifies domain mastery into **Mastered (≥80%)**, **Competent (≥60%)**, and **Needs Revision (<60%)**.
   - Directly maps skill deficiencies to verified **iGOT Karmayogi courses** with direct enrollment links.

5. **Role-Based Access Control (RBAC)**:
   - Full JWT authentication with role guards (`admin` for Senior Trainers and `learner` for Government Trainees/Officers).

---

## 🛠️ Architecture & Tech Stack

```
SmartSkill AI Architecture
┌─────────────────────────────────────────────────────────────┐
│  React 19 + TypeScript + Tailwind CSS Frontend (Port 3000)   │
│  - Admin HITL Dashboard (PDF Upload, MCQ Generator, Review) │
│  - Learner Assessment Portal (Timed Quiz, Gap Analysis)     │
│  - 1-Click Evaluator Demo Authentication                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reverse Proxy / Vite / Nginx
┌──────────────────────────────▼──────────────────────────────┐
│  FastAPI Asynchronous Backend Engine (Port 8000)             │
│  - JWT Bearer Authentication & Role Guards                  │
│  - PDF Ingestion & Tabular OCR Pipeline                     │
│  - LangChain + Google Gemini Pro (Temp 0.0)                 │
│  - iGOT Karmayogi Course Recommendation Engine              │
│  - Global Exception Handling & Timing Telemetry             │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLAlchemy 2.0 / Alembic
┌──────────────────────────────▼──────────────────────────────┐
│  PostgreSQL 16 (Docker) / SQLite Local Automated Fallback   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Option A: Run with Docker Compose (Production Deployment)

Ensure Docker is running, then execute:

```bash
# 1. Clone repository & enter directory
cd d:/sih-project

# 2. Copy environment template
cp .env.example .env

# 3. Spin up Postgres, FastAPI, and React services
docker compose up --build -d

# 4. View running services
docker compose ps
```

- **Frontend Portal**: `http://localhost:3000`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **Alternative Redoc Documentation**: `http://localhost:8000/redoc`

---

### Option B: Run Locally on Host (Windows / Linux / macOS)

SmartSkill AI includes an **automatic SQLite fallback**, allowing instant execution without requiring a running PostgreSQL instance.

#### 1. Backend Setup:

```powershell
# Navigate to backend
cd d:\sih-project\backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run database seeder (seeds users, sample MoSPI PDF, and HITL quiz queues)
python seed.py

# Launch FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 2. Frontend Setup:

In a separate terminal window:

```powershell
# Navigate to frontend
cd d:\sih-project\frontend

# Start Vite development server
npm run dev
```

Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🔑 Pre-Seeded Evaluator Accounts

The system is seeded with realistic accounts for immediate zero-friction evaluation:

| Role | Email | Password | Name / Designation | Organization |
|---|---|---|---|---|
| **Admin Trainer** | `admin@mospi.gov.in` | `Admin@123` | Dr. Arvind Saxena (Senior DDG) | National Statistical Systems Training Academy (NSSTA) |
| **Learner Officer** | `officer@mospi.gov.in` | `Learner@123` | Pooja Sharma (Junior Statistical Officer) | Field Operations Division (FOD), MoSPI |

*Note: You can also use the **"⚡ One-Click Evaluator Sign-In"** buttons in the UI for instant access without typing!*

---

## 🧪 Automated Testing & Verification

Run the full backend test suite covering authentication, document ingestion, HITL review actions, and assessment gap analytics:

```powershell
cd d:\sih-project
backend\.venv\Scripts\pytest backend/tests/test_api.py -v
```

All 7 integration tests run against the live API engine and validate schema conformity.

Verify the frontend TypeScript build:

```powershell
cd d:\sih-project\frontend
npm run build
```

---

## 📄 License & Ministry Credits

Developed for capacity building and skill enablement in official statistics under the aegis of the Ministry of Statistics & Programme Implementation (MoSPI) and India's Mission Karmayogi.
