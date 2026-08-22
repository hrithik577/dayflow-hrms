# DAYFLOW — Database & Data Platform Documentation

**Data Platform Lead**: Hrithik (`hrithik-data-platform`)  
**Database**: PostgreSQL / SQLAlchemy 2.0 / Alembic

---

## 1. System Architecture Overview

The **DAYFLOW Data Platform** serves as the single source of truth for the entire HRMS and Workforce Intelligence Platform. All core HR metrics, employee records, attendance check-ins, leave request balances, payroll compensation structures, audit trails, and AI guardrail event logs are persisted in normalized PostgreSQL tables.

```
                  +-----------------------------------+
                  |        FastAPI REST APIs          |
                  +-----------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
   +-----------------+     +-----------------+     +-----------------+
   | Employee Data   |     | Workforce       |     | Audit & AI      |
   | Repositories    |     | Analytics (SQL) |     | Event Storage   |
   +-----------------+     +-----------------+     +-----------------+
            \                       |                      /
             \                      |                     /
              +---------------------+--------------------+
                                    |
                  +-----------------------------------+
                  |     SQLAlchemy 2.0 ORM Base       |
                  +-----------------------------------+
                                    |
                  +-----------------------------------+
                  |      PostgreSQL Database          |
                  +-----------------------------------+
```

---

## 2. Table Schemas & Relationships

DAYFLOW implements 16 normalized relational tables:

### 1. `users`
Authentication identities and role-based access control.
- `id` (INT, PK, AUTO_INCREMENT)
- `email` (VARCHAR(255), UNIQUE, INDEX)
- `password_hash` (VARCHAR(255))
- `role` (VARCHAR(50)): `ADMIN`, `HR`, `EMPLOYEE`, `MANAGER`
- `is_active` (BOOLEAN, DEFAULT True)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2. `departments`
Company organizational structure.
- `id` (INT, PK)
- `name` (VARCHAR(100), UNIQUE, INDEX)
- `code` (VARCHAR(20), UNIQUE, INDEX)
- `description` (TEXT)
- `manager_id` (INT, FK -> `users.id`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3. `employees`
Core employee profile and organizational metadata.
- `id` (INT, PK)
- `user_id` (INT, FK -> `users.id`, UNIQUE, CASCADE)
- `employee_code` (VARCHAR(50), UNIQUE, INDEX)
- `first_name`, `last_name` (VARCHAR(100))
- `phone`, `address`, `city` (VARCHAR/TEXT)
- `department_id` (INT, FK -> `departments.id`, INDEX)
- `designation` (VARCHAR(100))
- `joining_date` (DATE)
- `manager_id` (INT, FK -> `employees.id`)
- `profile_picture_url` (VARCHAR(500))
- `employment_status` (VARCHAR(50)): `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`, `TERMINATED`
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 4. `attendance`
Daily workforce attendance tracking and working hours.
- `id` (INT, PK)
- `employee_id` (INT, FK -> `employees.id`, INDEX)
- `date` (DATE, INDEX)
- `check_in`, `check_out` (TIMESTAMPTZ)
- `status` (VARCHAR(50), INDEX): `PRESENT`, `ABSENT`, `HALF_DAY`, `LEAVE`, `LATE`
- `working_hours` (FLOAT)
- `source` (VARCHAR(50)): `WEB`, `MOBILE`, `BIOMETRIC`, `AI_AUTO`
- `notes` (TEXT)
- Composite Index: `idx_attendance_emp_date` on (`employee_id`, `date`)
- Composite Index: `idx_attendance_date_status` on (`date`, `status`)

### 5. `leave_types`
Configurable leave categories and annual quotas.
- `id` (INT, PK)
- `name` (VARCHAR(100))
- `code` (VARCHAR(20), UNIQUE, INDEX): `PAID`, `SICK`, `CASUAL`, `MATERNITY`, `PATERNITY`, `UNPAID`
- `max_days_per_year` (INT)
- `is_paid` (BOOLEAN)
- `description` (TEXT)

### 6. `leave_requests`
Employee leave application workflow storage.
- `id` (INT, PK)
- `employee_id` (INT, FK -> `employees.id`, INDEX)
- `leave_type_id` (INT, FK -> `leave_types.id`, INDEX)
- `start_date`, `end_date` (DATE)
- `total_days` (FLOAT)
- `reason` (TEXT)
- `status` (VARCHAR(50), INDEX): `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- `reviewed_by` (INT, FK -> `users.id`)
- `reviewer_comment` (TEXT)

### 7. `leave_balances`
Yearly leave balance tracking per employee per leave type.
- `id` (INT, PK)
- `employee_id` (INT, FK -> `employees.id`, INDEX)
- `leave_type_id` (INT, FK -> `leave_types.id`, INDEX)
- `allocated_days`, `used_days`, `pending_days`, `remaining_days` (FLOAT)
- `year` (INT, INDEX)
- Unique Constraint: `uq_emp_leave_year` on (`employee_id`, `leave_type_id`, `year`)

### 8. `payroll`
Basic salary structure, allowances, and deductions visibility.
- `id` (INT, PK)
- `employee_id` (INT, FK -> `employees.id`, INDEX)
- `basic_salary`, `allowances`, `deductions`, `net_salary` (NUMERIC(12, 2))
- `effective_from`, `effective_to` (DATE)
- `currency` (VARCHAR(10))
- `updated_by` (INT, FK -> `users.id`)

### 9. `documents`
Employee document attachment store.
- `id` (INT, PK)
- `employee_id` (INT, FK -> `employees.id`, INDEX)
- `title`, `document_type`, `file_url` (VARCHAR)
- `uploaded_by` (INT, FK -> `users.id`)

### 10. `notifications`
User alert and notification log.
- `id` (INT, PK)
- `user_id` (INT, FK -> `users.id`, INDEX)
- `title`, `message`, `type`, `is_read`, `link`

### 11. `audit_logs`
Non-repudiable audit storage for system and AI actions.
- `id` (INT, PK)
- `user_id` (INT, FK -> `users.id`, INDEX)
- `role`, `action`, `entity_type`, `entity_id`
- `old_value`, `new_value`, `source`, `ip_address`, `user_agent`
- Logged Events: `login`, `logout`, `check_in`, `check_out`, `leave_creation`, `leave_approval`, `leave_rejection`, `payroll_modification`, `role_change`, `AI_RECOMMENDATION`, `AI_ACTION`, `BLOCKED_AI_REQUEST`.

### 12. `ai_events`
Audit log for autonomous AI agent invocations and tool executions.
- `id` (INT, PK)
- `request_id`, `user_id`, `agent_name`, `action_type`
- `input_summary`, `data_sources`, `decision`, `confidence`
- `guardrail_status`, `human_approval_required`, `human_approved`
- `tool_name`, `tool_result_reference`

### 13. `ai_insights`
Proactive workforce intelligence findings.
- `id` (INT, PK)
- `title`, `category`, `description`, `metrics_json`, `severity`, `is_dismissed`

### 14. `attendance_anomalies`
AI-detected anomalous attendance patterns.
- `id` (INT, PK)
- `employee_id`, `date`, `anomaly_type`, `severity`, `description`, `status`, `detected_by`

### 15. `workforce_metrics`
Daily snapshot of organization workforce health.
- `id` (INT, PK)
- `metric_date`, `total_employees`, `attendance_rate`, `late_rate`, `leave_rate`, `turnover_rate`, `department_breakdown_json`

### 16. `policies`
Company policies and compliance documentation.
- `id` (INT, PK)
- `title`, `category`, `content`, `version`, `effective_date`, `is_active`

---

## 3. Database Setup & Migrations

### Local Environment Setup
```bash
# 1. Clone repository and checkout branch
git checkout hrithik-data-platform

# 2. Run Alembic Database Migrations
alembic upgrade head

# 3. Seed Deterministic Demo Data
python -m scripts.seed

# 4. Launch FastAPI Dev Server
uvicorn app.main:app --reload --port 8000
```

---

## 4. Seed Data Details

The seed generator (`app/seeds/seed_data.py`) creates:
- **1 Admin user**: `admin@dayflow.com` (Password: `Dayflow@2026`)
- **2 HR users**: `hr1@dayflow.com`, `hr2@dayflow.com`
- **25 Employees** across Engineering, HR, Finance, Sales, Operations departments.
- **30 days of attendance history** per employee.
- **Leave types and 2026 balances** for all employees.
- **5 sample leave requests** across PENDING, APPROVED, and REJECTED states.
- **Payroll compensation records** for all 25 active employees.
- **Audit events, AI events, AI Insights, Anomalies, and Workforce Metrics**.
