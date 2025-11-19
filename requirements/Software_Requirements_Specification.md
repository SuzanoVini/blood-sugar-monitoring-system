# Software Requirements Specification (SRS) — Markdown Version

Note: This is a Markdown transcription of the original document “requirements/Software Requirements Specification.docx”, based on the project artifacts available in this repository. It keeps the original intent and headings in a concise format suitable for developers and reviewers.

## 1. Introduction
- Project: Blood Sugar Monitoring System (BSMS)
- Purpose: Define functional and non‑functional requirements for a web system that helps patients track blood sugar, lets specialists monitor and provide feedback, and supports alerts, admin reporting, and staff threshold management.
- Audience: Course staff, developers, testers.
- References: `design/SDD team 7.pdf`, `design/SDD_team_7.md`, `blood-sugar-monitoring-system/database/blood_sugar_monitoring_system.sql`, `BACKEND_APIS_ROUTES_OVERVIEW.md`, `ARCHITECTURE_EXPLANATION.md`.

## 2. Overall Description
- Product perspective: SPA frontend (React + TS) with REST backend (Node + Express) and MySQL database.
- Users & roles: Patient, Specialist, Clinic Staff, Administrator.
- Product functions (high level):
  - Patients: record readings, view history/trends/suggestions, receive alerts.
  - Specialists: view assigned patients and their readings, provide feedback.
  - Clinic Staff: manage system thresholds, view patient records (read‑only).
  - Administrator: manage users, generate reports, view stats.
  - System/AI: analyze abnormal readings for patterns; auto‑categorize readings; detect weekly alert conditions.
- Operating environment: Browser + Vite dev server (frontend), Node/Express server (backend), MySQL/MariaDB.
- Design & implementation constraints: course scope; database schema provided; role‑based access; stateless API in implementation.
- Assumptions and dependencies: local dev on `http://localhost:3000` (frontend) and `http://localhost:5000` (backend).

## 3. System Features (Functional Requirements)
The list below groups verifiable requirements by area. IDs are for traceability.

### 3.1 Authentication (AUTH‑FR)
- AUTH‑FR‑1: Users can register (Patient), login, and logout.
- AUTH‑FR‑2: Protected endpoints require authenticated access.
- AUTH‑FR‑3: Role‑based access control gates Admin/Staff/Patient/Specialist routes.

### 3.2 Patient (PAT‑FR)
- PAT‑FR‑1: Add a reading with date/time, value, unit, notes (food/activity/symptoms).
- PAT‑FR‑2: Readings are categorized automatically (Normal/Borderline/Abnormal) using thresholds.
- PAT‑FR‑3: View reading history with filters (date range, category) and pagination.
- PAT‑FR‑4: View AI suggestions based on abnormal patterns (foods/activities).

### 3.3 Specialist (SPC‑FR)
- SPC‑FR‑1: View assigned patient list.
- SPC‑FR‑2: View a patient’s reading history and details.
- SPC‑FR‑3: Provide feedback messages to a patient.

### 3.4 Clinic Staff (STF‑FR)
- STF‑FR‑1: View system thresholds (current version).
- STF‑FR‑2: Update thresholds (new version inserted).

### 3.5 Administrator (ADM‑FR)
- ADM‑FR‑1: Create/delete users (specialist, staff) as needed.
- ADM‑FR‑2: Generate and retrieve system reports (monthly/yearly).
- ADM‑FR‑3: View system‑wide statistics.

### 3.6 Alerts & Notifications (ALT‑FR)
- ALT‑FR‑1: System detects >3 abnormal readings in a rolling 7‑day window for a patient.
- ALT‑FR‑2: When triggered, an alert record is stored with recipients (patient & specialist).
- ALT‑FR‑3: System prepares notifications for both patient and assigned specialist.

### 3.7 AI Suggestions (AI‑FR)
- AI‑FR‑1: Analyze abnormal readings and correlate repeated food/activity items.
- AI‑FR‑2: Produce short suggestions with an indication of frequency/percent.

## 4. External Interface Requirements
- User interface: SPA with dashboards for each role; forms for entering readings; lists/tables for history.
- API: REST endpoints under `/api/*` returning JSON.
- Database: MySQL schema defined in `blood_sugar_monitoring_system.sql`.
- Security: JWT in implementation; role middleware; parameterized SQL; sensitive fields excluded from responses.

## 5. Use Case Diagram
The SRS use cases are summarized in the following diagram:

![Use Case Diagram](img/Corrected%20Use%20case%20diagram.png)

## 6. Non‑Functional Requirements
- Security (NFR‑SEC): parameterized SQL, role checks, protected routes; avoid logging PII in production.
- Performance (NFR‑PERF): typical page/API responses < 1s on local dev hardware; queries indexed by patient/date.
- Reliability (NFR‑REL): DB constraints/foreign keys; error handling for API failures.
- Usability (NFR‑USA): simple forms; clear feedback; minimal steps to add readings.
- Maintainability (NFR‑MAI): modular API files and routes; threshold versioning; code comments and docs.
- Portability (NFR‑PORT): Node/Express + React/Vite stack runs cross‑platform with MySQL.

## 7. Data Requirements & Business Rules
- Readings must include `Patient_ID`, `DateTime`, and `Value`.
- Categorization uses latest thresholds; patient custom normal range overrides system normal only.
- Weekly alert condition: abnormal count strictly greater than 3 within the past 7 days.
- Specialist‑patient access must verify assignment for protected specialist operations.

## 8. Acceptance Criteria (Samples)
- A user can add a reading and see it appear in history with a category and timestamp.
- Protected endpoints return 401 without Authorization; succeed with a valid token.
- Patient cannot read another patient’s data; specialist can read only assigned patients.
- When abnormal count >3 in 7 days, an alert record appears for that patient.
- AI suggestions list at least one repeated item when criteria are met (≥3 occurrences and ≥40%).

## 9. Traceability
- Each FR/NFR maps to implementation: see `BACKEND_APIS_ROUTES_OVERVIEW.md` and route/API files under `blood-sugar-monitoring-system/backend` for coverage; DB schema in `database/` for data layer mapping; UI features in `frontend/src`.

---
This Markdown is provided to ease navigation and review. Consult the original Word document for the authoritative course submission format.
