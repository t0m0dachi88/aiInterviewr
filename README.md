# AI-Powered Technical Hiring Platform

Production-minded, multi-tenant technical hiring infrastructure where companies can create technical interviews, invite candidates, conduct collaborative live coding interviews, execute code securely in isolated environments, and produce structured evaluation records.

---

## Managed Cloud Infrastructure

This platform uses **100% external managed cloud infrastructure**.
**Developers are not required to run or install local MongoDB or Redis servers.**

| Component              | Managed Provider                   | Purpose                                      | Security & Protocol                     |
| ---------------------- | ---------------------------------- | -------------------------------------------- | --------------------------------------- |
| **Primary Database**   | **MongoDB Atlas**                  | Multi-tenant persistent data storage         | `mongodb+srv://` (TLS encrypted)        |
| **Cache & Task Queue** | **Upstash Redis**                  | BullMQ task queue & rate limiting / presence | `rediss://` TLS Port 6379               |
| **Queue Producer**     | **Express API (`apps/api`)**       | Enqueues code execution jobs via BullMQ      | Backend only (no credentials on client) |
| **Queue Consumer**     | **Worker Service (`apps/worker`)** | Standalone long-running worker process       | Dedicated compute service               |
| **Frontend**           | **React Web App (`apps/web`)**     | SaaS user interface                          | Zero database/Redis credentials exposed |

---

## Monorepo Architecture

```text
ai_interviewer/
├── apps/
│   ├── web/                     # React 18 + TypeScript frontend (Vite, Tailwind CSS, React Router)
│   ├── api/                     # Express.js backend (Modular Monolith MVC, Queue Producer)
│   └── worker/                  # Standalone long-running worker service (Queue Consumer)
│
├── packages/
│   └── shared/                  # Shared constants, error codes, and API response envelopes
│
├── infrastructure/
│   └── docker/
│       └── README.md            # Cloud infrastructure guide & Upstash setup documentation
│
├── docs/                        # Architecture & engineering specifications
│   ├── PROJECT_REQUIREMENTS.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   └── IMPLEMENTATION_PLAN.md
│
├── .gitignore
├── .env.example
├── package.json
├── README.md
└── PROJECT_STATUS.md
```

---

## Prerequisites

- **Node.js**: `v20+` or `v22+` (tested on `v24.22.0`)
- **npm**: `v10+` or `v11+`
- **MongoDB Atlas**: Free or paid cloud cluster URI
- **Upstash Redis**: Free or paid serverless cloud Redis instance (TLS enabled)

---

## 1. Upstash Redis Setup Guide

1. Log in or create a free account at [Upstash](https://console.upstash.com/).
2. Click **Create Database**.
3. Choose a name (e.g., `hirepulse-dev`) and pick the region closest to your application deployment.
4. Enable **TLS** (Upstash enables TLS by default).
5. From the database details page, view the **Node.js (ioredis)** connection credentials:
   - `Host`: e.g. `flowing-mammal-12345.upstash.io`
   - `Port`: `6379`
   - `Password`: `<your-upstash-password>`
   - `TLS`: `true`

---

## 2. Environment Configuration

Copy the example environment files:

```bash
# Root example
cp .env.example .env

# Backend API
cp apps/api/.env.example apps/api/.env

# Worker Service
cp apps/worker/.env.example apps/worker/.env

# Frontend Web
cp apps/web/.env.example apps/web/.env
```

### Backend API Variables (`apps/api/.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/technical_hiring_platform?retryWrites=true&w=majority

# Upstash Redis Managed Instance (with TLS)
UPSTASH_REDIS_HOST=your-database.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=your_upstash_password
UPSTASH_REDIS_TLS=true

# Allowed CORS Origin for web frontend
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Worker Service Variables (`apps/worker/.env`)

```env
NODE_ENV=development
WORKER_REDIS_HOST=your-database.upstash.io
WORKER_REDIS_PORT=6379
WORKER_REDIS_PASSWORD=your_upstash_password
WORKER_REDIS_TLS=true
WORKER_CONCURRENCY=5
```

### Frontend Web Variables (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

> **Security Rule**: MongoDB Atlas and Upstash Redis credentials must stay strictly on backend services (`apps/api` and `apps/worker`). They are never bundled into or accessible by the frontend web client.

---

## 3. BullMQ Connection Requirements

BullMQ connection options are configured according to official BullMQ specifications:

1. **`maxRetriesPerRequest: null`**: Strictly required by BullMQ to allow blocking commands.
2. **`enableReadyCheck: false`**: Recommended for Upstash serverless instances to avoid ping stalls.
3. **`tls: { rejectUnauthorized: true }`**: Enforces encrypted in-transit communication with Upstash.
4. **Producer / Consumer Separation**:
   - `apps/api/src/config/queue.js`: Defines queue producers.
   - `apps/worker/src/config/queue.js`: Defines queue consumers.

---

## 4. Running the Platform Locally

### Install dependencies across all workspaces

```bash
npm install
```

### Run development services

```bash
# Run both API and Web concurrently
npm run dev

# Or run services individually:
npm run dev:api     # Backend API on http://localhost:5000
npm run dev:web     # Frontend on http://localhost:5173
npm run dev:worker  # Standalone Worker service
```

> **Zero Local Server Requirement**: You do not need Docker or local servers running to develop or test. If external credentials are not set in development, the API and frontend will run gracefully and report dependency status through the `/api/v1/health/ready` probe.

---

## 5. Health & Readiness Probes

- **Liveness Probe**: `GET /api/v1/health`
  Returns process status, uptime, and service version (HTTP 200).
- **Readiness Probe**: `GET /api/v1/health/ready`
  Verifies live connectivity to **MongoDB Atlas** and **Upstash Redis**:
  - HTTP 200 if all cloud dependencies are connected.
  - HTTP 503 with dependency diagnostic breakdown if any service is unconfigured or degraded.

---

## 6. Automated Testing & Verification

Automated test suites utilize dependency injection and mocked adapters so tests run reliably without live external credentials:

```bash
# Run all tests across workspaces
npm test

# Run workspace-specific tests
npm test --workspace=@platform/api
npm test --workspace=@platform/web
npm test --workspace=@platform/shared

# Run linting
npm run lint

# Run production builds
npm run build

# Check code formatting
npm run format:check
```

---

## 7. Current Status: Phase 0 Completed

- Phase 0 establishes the monorepo, Upstash Redis & Atlas configurations, BullMQ boundary, API probes, React frontend, and worker scaffold.
- **Phase 1 (Next)**: Authentication (JWT rotation), tenant-isolated organizations, and invitation lifecycle.
