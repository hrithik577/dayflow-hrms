# DAYFLOW — AI-Native HRMS & Workforce Intelligence Platform

## Data Platform & Backend Foundation (`hrithik-data-platform`)

This repository branch contains the complete database engine, ORM models, Alembic migrations, clean repositories, SQL-based workforce analytics engine, FastAPI REST endpoints, and deterministic seed data generator for **DAYFLOW**.

### Quickstart

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Alembic Schema Migrations**:
   ```bash
   alembic upgrade head
   ```

3. **Seed Demo Data**:
   ```bash
   python -m scripts.seed
   ```

4. **Launch FastAPI Development Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Run Test Suite**:
   ```bash
   pytest
   ```

### Documentation
See [docs/database.md](docs/database.md) for full ER diagrams, 16 model table schemas, relationships, indexes, and API specifications.
