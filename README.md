# EcoSphere — ESG Management Platform

A full-stack ESG (Environmental, Social, Governance) management platform built in an **8-hour hackathon** for Odoo, on the MERN stack (React, Node/Express, MongoDB), with the backend written in TypeScript.

---

## 1. Project Overview

Most companies track ESG data across disconnected tools — carbon numbers in a spreadsheet, CSR participation in an HR system, compliance findings in a shared drive. EcoSphere puts all four ESG pillars — **Environmental, Social, Governance, and Gamification** — behind one login, backed by one database, with role-based access for two kinds of users: an **Admin** who configures and reviews the organization, and an **Employee** who participates in it (joins challenges, logs CSR activity, acknowledges policies, redeems rewards).

The core idea: instead of an ESG "report" generated after the fact, scores are computed live from the same transactional data employees and admins interact with daily — carbon entries, CSR approvals, compliance issues, training completion. Change the underlying data, and the score changes with it.

---

## 2. Problem Statement

ESG reporting is usually:
- **Manual** — someone assembles numbers from several places once a quarter.
- **Disconnected** — carbon accounting, HR/diversity data, and governance audits live in separate systems.
- **Backward-looking** — reports describe what already happened, not what's happening now.

The hackathon brief asked for a platform that measures, manages, and improves ESG performance by integrating operational data, employee participation, and compliance activity into one dashboard — with gamification as the mechanism to keep employees engaged rather than treating ESG as a compliance chore.

---

## 3. Solution Overview

A logged-in user lands on a role-appropriate dashboard. An **Admin** sees org-wide ESG scores, manages master data (departments, emission factors, policies), reviews CSR/challenge submissions, and configures platform-wide settings. An **Employee** sees their own XP/points/badges, joins challenges and CSR activities, acknowledges policies, and redeems rewards — all scoped server-side to their own account, not just hidden in the UI.

**Request flow for a typical action** (e.g., an admin approving a CSR submission):

```
React frontend (fetch via a shared api.js client)
        ↓
Express route (JWT auth + role check)
        ↓
Mongoose model (schema validation + hooks)
        ↓
MongoDB (read/write)
        ↓
Side effects: XP update → badge auto-award check → SSE notification pushed to the employee
```

Scores aren't stored as a single number that gets stale — `GET /api/reports/esg-score` runs a live MongoDB aggregation pipeline across departments, goals, participation, and compliance data every time it's called.

---

## 4. Key Features

**Implemented and working:**

- JWT authentication with two roles (Admin / Employee), enforced in Express middleware — not just hidden buttons in the UI
- Full CRUD for master data: departments, categories, emission factors, product ESG profiles, environmental goals, ESG policies, badges, rewards
- Carbon transaction logging with automatic CO₂e calculation from quantity × emission factor
- **Anomaly detection** — a new transaction is compared against its department's historical average and flagged if it's 10x+ above normal, pending admin review
- **Cryptographic hash-chain ledger** for carbon transactions (each entry is SHA-256 linked to the previous one, so historical tampering is detectable) with an optional, disabled-by-default anchor to the Algorand public testnet
- CSR activities with join/approve/reject workflow and file-upload evidence (via Multer, stored locally)
- Challenge system with a real lifecycle (Draft → Active → Under Review → Completed, or Archived at any point), enforced server-side
- **Auto-award badge engine** — a Mongoose post-save hook checks XP/challenge thresholds and grants badges automatically, no admin action needed
- Reward redemption with atomic stock/points deduction (guards against a race condition on the last unit of stock)
- Diversity metrics and training completion tracking, both of which feed into the Social score calculation
- Governance module: policies, policy acknowledgements, audits, and compliance issues — with compliance issues auto-scoped so an employee only ever sees ones they own
- Live in-app notifications via Server-Sent Events (badge unlocks, approvals, new compliance issues, policy reminders)
- Scheduled jobs (`node-cron`): hourly overdue-compliance escalation, 5-minute leaderboard cache refresh, daily policy reminders, monthly ESG score snapshots
- Dynamic custom report builder (filter by department/date/module/employee) with CSV, Excel, and PDF export
- A single `Settings` document exposing runtime-configurable toggles (evidence requirement, badge auto-award, notification triggers, ESG pillar weighting) — changeable without a redeploy
- Database-level engineering beyond basic CRUD: sharding-ready schema design, majority read/write concern, explicit indexing, paginated list endpoints, and field-level projection to keep sensitive data out of API responses (see [Design Decisions](#8-important-design-decisions) for specifics)
- Seed script that populates realistic demo data, including a working hash-chained transaction history and 12 months of backfilled score snapshots for trend charts

---

## 5. System Architecture

```
 User (Admin or Employee)
        │
        ▼
 React Frontend (Vite, Tailwind CSS)
   - api.js: single fetch client, attaches JWT to every request
   - Role-aware UI: admin-only actions are hidden, not just disabled
        │  HTTP (JSON, multipart for file uploads)
        ▼
 Express API (Node.js + TypeScript)
   - Route layer: RBAC middleware (authenticateToken, requireAdmin)
   - Business logic: Mongoose hooks (hash-chaining, badge awards,
     anomaly detection, goal auto-tracking)
   - Cron layer: scheduled jobs independent of request/response cycle
        │
        ▼
 MongoDB (Mongoose ODM)
   - 20+ collections: master data, transactional data, gamification,
     governance, and a singleton Settings document
        │
        ▼
 Side channels: Server-Sent Events (live notifications),
                local disk (uploaded evidence files),
                Algorand testnet (optional, disabled by default)
```

---

## 6. Repository Structure

```
ecosphere-odoo/
├── backend/
│   └── src/
│       ├── models/       Mongoose schemas - one file per domain area
│       │                 (Employee, MasterData, CarbonTransaction,
│       │                 CSR, Challenge, Governance, Settings, etc.)
│       ├── routes/       Express routers - one file per feature area,
│       │                 RBAC applied per-route via middleware
│       ├── middleware/   auth.ts (JWT + role checks), upload.ts (Multer)
│       ├── utils/        Cross-cutting logic: hash-chaining, anomaly
│       │                 detection, ESG score aggregation, SSE hub,
│       │                 in-memory caches, Algorand anchoring
│       ├── cron/         Scheduled jobs, started once at server boot
│       ├── db.ts         MongoDB connection
│       ├── server.ts     Express app setup, route mounting
│       └── seed.ts       Demo data generator (faker-based)
│
└── frontend/
    ├── api.js            Single API client - every backend endpoint
    │                     goes through here, so auth/error handling
    │                     lives in exactly one place
    ├── components/
    │   ├── Home/         Landing page sections (hero, login form, etc.)
    │   └── dashboard/     Shared dashboard chrome (nav, sidebar, charts,
    │                      notification bell)
    ├── pages/            One file per module: Dashboard (Overview),
    │                     Environmental, Social, Governance,
    │                     Gamification, Reports, Settings
    └── src/
        ├── App.jsx       Auth check on load, routes logged-in users to
        │                 the dashboard and everyone else to the homepage
        ├── main.jsx      Vite entry point
        └── assets/, data/
```

---

## 7. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React (JavaScript) + Vite | UI, client-side routing state |
| Styling | Tailwind CSS | Utility-first styling, consistent design tokens |
| Backend | Node.js + Express + TypeScript | REST API, business logic |
| Database | MongoDB + Mongoose | Document storage, schema validation, hooks |
| Auth | JSON Web Tokens (JWT) | Stateless session auth, role-based access |
| File uploads | Multer | Local disk storage for CSR/challenge evidence |
| Scheduled jobs | node-cron | Compliance escalation, cache refresh, snapshots |
| Live updates | Server-Sent Events (native) | Push notifications without polling or a socket library |
| Report export | ExcelJS, PDFKit | Server-generated Excel/PDF report files |
| Seed data | @faker-js/faker | Realistic demo data generation |
| Optional | Algorand SDK (algosdk) | Testnet anchoring of the carbon transaction hash-chain |

---

## 8. Important Design Decisions

### MongoDB performance & scaling mandates

Five specific database-engineering requirements from the original spec, all implemented and commented in place (not just present incidentally):

| Mandate | Where | What it does |
|---|---|---|
| **A. Sharding readiness** | `CarbonTransaction.ts`, `CSR.ts` | Detailed inline comments explaining `departmentId`/`employeeId` as the shard key for these two highest-write-volume collections, and why — nearly every read filters by department or employee first, so a department/employee-keyed shard avoids cluster-wide scatter-gather queries. Not actually sharded (no cluster to shard in a hackathon), but the schema and query patterns are designed so it's a config change later, not a rewrite. |
| **B. Read/write isolation** | `db.ts` | Mongo connection explicitly configured with `readConcern: { level: 'majority' }` and `writeConcern: { w: 'majority' }` — the same config a production replica set (e.g. Atlas) needs for durability, not a hackathon-only shortcut. |
| **C. Explicit indexing** | `CarbonTransaction.ts` and others | `index: true` set directly on fields that get filtered constantly — `department`, `timestamp`, `status` — rather than relying on Mongo to figure it out. |
| **D. Memory-safe pagination** | Every list route (`masterData.routes.ts`, `challenge.routes.ts`, `csr.routes.ts`, `governance.routes.ts`, `training.routes.ts`, `diversity.routes.ts`) | `.skip()` + `.limit()` on every GET list endpoint, capped at 100 per page server-side even if a client asks for more. |
| **E. Field projection** | `Employee.ts`, `employee.routes.ts` | `passwordHash` has `select: false` at the schema level (never returned unless explicitly opted into for login), plus explicit `.select('-passwordHash')` on employee list/detail routes as a second layer. |

### Other design decisions

**Soft delete everywhere, no hard deletes on master data.**
Every master-data model carries an `isActive` flag instead of being removed from the collection. Given ESG data is inherently audit-sensitive, losing historical records to an accidental delete felt like the wrong default — even in a hackathon build.

**A hash-chain instead of a real blockchain.**
Carbon transactions needed to feel tamper-evident without standing up real blockchain infrastructure in a few hours. Each transaction stores a SHA-256 hash of its own data plus the previous transaction's hash (Node's built-in `crypto` module, no dependency). Tampering with any historical entry breaks every hash after it. A genuine third-party anchor (Algorand testnet) is wired in but off by default, since it needs a funded account and network access that can't be assumed in every environment.

**RBAC enforced in Express middleware, mirrored — not duplicated — in the UI.**
Every admin-only mutation is gated server-side (`requireAdmin` middleware), independent of anything the frontend does. The frontend then reads the logged-in user's role and hides actions that would otherwise 403, so the UI matches what's actually permitted instead of showing controls that fail on click. This was tightened partway through development after an early version over-blocked an entire page for employees instead of gating individual actions.

**A generic CRUD factory for master data.**
Eight master-data entities (departments, categories, emission factors, etc.) share an identical shape: list, create, update, soft-delete. Rather than writing eight near-identical route files, one factory function generates all of them from a Mongoose model and a URL path. Same pattern mirrored on the frontend's `api.js`.

**Denormalized department fields on transactional records.**
`EmployeeParticipation`, `ChallengeParticipation`, and `ComplianceIssue` all copy the employee's department at write time instead of requiring a join to compute department-level ESG scores. Standard read-speed-over-write-simplicity trade-off, deliberate given how often the scoring aggregation runs.

**`Promise.allSettled`, not `Promise.all`, for multi-source page loads.**
Most dashboard pages load from several endpoints at once. An early version used `Promise.all`, which meant one failed request (even an unrelated, non-critical one) discarded every other result on the page. Switched to `allSettled` with per-source error tracking so a single failure degrades gracefully instead of blanking the whole page.

---

## 9. Local Setup

**Prerequisites:** Node.js 18+, MongoDB (local install or a free Atlas cluster).

```bash
git clone https://github.com/IndiraTejaswini/ecosphere-odoo.git
cd ecosphere-odoo

# installs concurrently at the root; backend/frontend deps installed separately
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

**Backend environment** — `backend/.env` is gitignored, so create it yourself:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/your-database-name
JWT_SECRET=replace-with-a-long-random-string

SEED_ADMIN_EMAIL=admin@ecosphere.com
SEED_ADMIN_PASSWORD=Admin@123
SEED_USER_PASSWORD=User@123

ALGORAND_ENABLED=false
```

**Seed demo data** (creates an admin account, ~20 employees, and realistic transaction/participation history):

```bash
cd backend && npm run seed
```

**Run both servers together** from the repo root:

```bash
npm run dev
```

This starts the backend (`:5000`) and frontend (`:5173`) concurrently via the root script. Default login after seeding: `admin@ecosphere.com` / `Admin@123` (or `emp1@ecosphere.com` … `emp20@ecosphere.com` / `User@123` for an employee view).

---
