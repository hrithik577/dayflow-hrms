# DAYFLOW — AI-Native Human Resource Management & Workforce Intelligence Platform

> **DAYFLOW HRMS — Full Stack Monorepo**  
> *"Every workday, perfectly aligned."*

Dayflow goes beyond traditional CRUD HRMS products. It is an **AI-native HR operations platform** that captures workforce events, performs intelligent coverage and anomaly analysis, generates explainable recommendations, enforces strict role-based AI guardrails, and records an auditable trail of every business operation in real time.

---

## 🌟 Key Features

### 🔐 1. Authentication & RBAC Security Engine
- Multi-role authorization model (`EMPLOYEE`, `HR`, `ADMIN`).
- Password security using native `bcrypt` hashing and PyJWT token expiration.
- Strict backend authorization dependencies ensuring non-HR users cannot access unauthorized payroll, global audit logs, or administrative command dashboards.

### 👤 2. Employee Self-Service Portal
- **Interactive Check-In / Check-Out**: Real-time working hours counter and status badge (`PRESENT`, `LATE`, `ABSENT`, `LEAVE`).
- **Leave Management**: Submit leave requests with instant **Smart Leave Intelligence** coverage feedback (calculates department overlap and remaining team availability).
- **Personal Payslip Viewer**: View basic salary, allowances, deductions, and net salary.
- **Personal Activity Timeline**: Real-time audit log of user's own system interactions.

### 📊 3. HR & Admin Command Center
- **Key Metrics Strip**: Live headcount, present count, absent count, on-leave count, late arrivals, and company attendance rate %.
- **Attendance Trend & Department Health**: Interactive attendance area charts and department health status indicators (`HEALTHY`, `REVIEW`, `ATTENTION`).
- **Smart Leave Pipeline**: One-click approval/rejection with reviewer comments and real-time leave balance updates.
- **AI Attention Signals**: Neutral, evidence-backed workforce attention warnings (e.g. repeated late check-ins, attendance drops) with recommended manager check-in actions.
- **Live Activity Feed**: Real-time system activity stream powered by WebSockets.

### 🤖 4. Dayflow AI Copilot & Guardrail System
- **Dual Execution Engine**: Connects to LLM APIs or uses a deterministic internal database query router (`tools.py`) to answer natural language questions accurately without hallucinating or requiring external keys during evaluation.
- **Strict Security Guardrail**: Intercepts all AI prompts against caller role permissions. If an employee asks for unauthorized data (e.g., *"Show everyone's salaries"* or *"Show company audit logs"*), the request is immediately **BLOCKED**, logged in `ai_events`, recorded in `audit_logs`, and returned with a clear security explanation.
- **Explainable Evidence & Confidence**: Displays source tables (`attendance`, `employees`, `workforce_metrics`), tool execution tags, and confidence scores for every answer.

### 📜 5. Immutable Audit System
- Logs all critical system operations (`USER_LOGIN`, `ATTENDANCE_CHECK_IN`, `CREATE_LEAVE_REQUEST`, `APPROVE_LEAVE_REQUEST`, `UPDATE_PAYROLL_STRUCTURE`, `BLOCKED_AI_REQUEST`).
- Filterable audit viewer for HR and Admin with role, user, action search, and entity breakdown.

---

## 🏗 Architecture & Tech Stack

```
                          ┌────────────────────────────────────────────────────────┐
                          │                      REACT FRONTEND                    │
                          │   Vite + Tailwind CSS + Recharts + Lucide + Context   │
                          └───────────────────────────┬────────────────────────────┘
                                                      │ REST / WebSockets
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │                     FASTAPI BACKEND                    │
                          │  Authentication (JWT) + RBAC Engine + REST Controllers │
                          └─────┬─────────────────────┬──────────────────────┬─────┘
                                │                     │                      │
                                ▼                     ▼                      ▼
                     ┌───────────────────┐  ┌──────────────────┐  ┌───────────────────┐
                     │ AI GUARDRAIL ENGINE│  │ ANALYTICS ENGINE │  │   AUDIT ENGINE    │
                     │  Scope & Security │  │ Anomalies & Risk │  │ Event Persistence │
                     └──────────┬────────┘  └─────────┬────────┘  └─────────┬─────────┘
                                │                     │                      │
                                └─────────────────────┼──────────────────────┘
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │                 SQLALCHEMY ORM & POOL                  │
                          └───────────────────────────┬────────────────────────────┘
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │         POSTGRESQL (Auto SQLite Fallback for Demo)     │
                          └────────────────────────────────────────────────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, React Router.
- **Backend**: Python 3.14, FastAPI, SQLAlchemy ORM, Pydantic v2, PyJWT, Bcrypt, WebSockets, Uvicorn.
- **Database**: PostgreSQL (with auto-SQLite fallback for zero-config hackathon execution).

---

## ⚡ Quick Start & Installation

### 1. Backend Setup & Seeding
```bash
# Install Python backend dependencies
pip install -r backend/requirements.txt

# Run migrations & seed demo data
python3 backend/seed.py

# Launch the FastAPI backend server (runs on port 8000)
python3 backend/run.py
```

### 2. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install frontend dependencies
npm install

# Launch Vite development server (runs on port 5173)
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🔑 Demo Credentials

Click any of the **1-Click Demo Profile Buttons** in the top bar / login screen:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| 👑 **ADMIN** | `admin@dayflow.com` / `sarah.connor@dayflow.internal` | `Admin@123` / `password123` | Command Center, Workforce Analytics, AI Insights, Audit Trail, Payroll Management |
| 👩‍💼 **HR** | `hr.sarah@dayflow.com` / `michael.vance@dayflow.internal` | `HR@123` / `password123` | Employee Directory, Attendance Logs, Leave Approvals, AI Copilot Workspace |
| 👨‍💻 **EMPLOYEE** | `rahul.sharma@dayflow.com` / `alex.morgan@dayflow.internal` | `Emp@123` / `password123` | Check-in/out, Apply for Leave, View Payslips, AI Assistant, Personal Timeline |

---

## 👥 Team Contributions

- **Member 1 (Hrithik — Data Platform)**: PostgreSQL database schema, SQLAlchemy ORM models, Alembic migrations, database repositories, seed generator script, SQLite fallback connector.
- **Member 2 (Lakshminarayana — UI/UX & Dashboards)**: Enterprise React design system, Executive Command Center dashboard, Employee punch portal, Recharts visualizations, AI Copilot drawer, custom UI components, responsive layout.
- **Member 3 (Harsha — AI Workflows & Security)**: JWT authentication, RBAC authorization middleware, AI Guardrail engine, Smart Leave Intelligence calculator, attendance anomaly engine, audit log service, WebSocket real-time event hub.
