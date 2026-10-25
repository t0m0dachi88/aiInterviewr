# Code Execution Worker Service

## Overview

The **Worker Service (`apps/worker`)** is an independent, long-running background service designed to execute untrusted candidate source code (JavaScript, Python, C++) in isolated, disposable sandboxes.

In accordance with architectural boundaries:

- **API (`apps/api`)** acts as the **Queue Producer**.
- **Worker (`apps/worker`)** acts as the **Queue Consumer**.
- Both services connect to the same **Upstash Redis (Managed Cloud Instance with TLS)**.

---

## Managed Redis Configuration (Upstash)

The worker connects to Upstash Redis using TLS. Credentials are provided via environment variables in `apps/worker/.env`:

```env
NODE_ENV=development
WORKER_REDIS_HOST=your-database.upstash.io
WORKER_REDIS_PORT=6379
WORKER_REDIS_PASSWORD=your_upstash_password
WORKER_REDIS_TLS=true
WORKER_CONCURRENCY=5
```

### BullMQ Connection Settings

Per official BullMQ requirements:

- `maxRetriesPerRequest: null` (strictly required by BullMQ worker).
- `enableReadyCheck: false` (optimal for Upstash serverless instances).
- `tls: { rejectUnauthorized: true }` (enforcing encrypted in-transit communication).

---

## Standalone Deployment Model

In production, the worker service is deployed on dedicated compute instances separate from the Express API control plane.

### Running the Worker

```bash
# In local development:
npm run dev:worker

# In production deployment:
npm run start --workspace=@platform/worker
```

---

## Phase 0 Status & Security Boundary

> **Security Guardrail**: In Phase 0, the worker establishes the queue consumer boundary and environment configuration. It **does NOT** execute arbitrary code, connect to the host Docker daemon, or accept external execution jobs. Disposable sandboxing with gVisor / Firecracker evaluation is scheduled for **Phase 4**.
