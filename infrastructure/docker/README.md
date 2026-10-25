# Managed Cloud Infrastructure Guide

This platform uses 100% managed external cloud services. **Developers are not required to run or install local MongoDB or Redis servers.**

## Services Overview

| Service                | Provider      | Purpose                                     | Connection Type             |
| ---------------------- | ------------- | ------------------------------------------- | --------------------------- |
| **Primary Database**   | MongoDB Atlas | Multi-tenant persistent data storage        | `mongodb+srv://` TLS        |
| **Cache & Task Queue** | Upstash Redis | BullMQ job queue & rate limiting / presence | `rediss://` TLS (Port 6379) |

---

## 1. Upstash Redis Setup

[Upstash](https://upstash.com/) provides serverless, cloud-hosted Redis with automatic TLS and global replication.

### Creating an Upstash Redis Database

1. Sign up or log in to the [Upstash Console](https://console.upstash.com/).
2. Click **Create Database**.
3. Enter a name (e.g. `hirepulse-prod` or `hirepulse-dev`).
4. Select your preferred region (choose a region close to your API / worker deployment).
5. Enable **TLS** (enabled by default on Upstash).
6. Under the database details page, locate the **Node.js (ioredis)** connection details:
   - **Host**: e.g., `flowing-mammal-12345.upstash.io`
   - **Port**: `6379`
   - **Password**: `<your-upstash-password>`
   - **TLS**: `true`

---

## 2. Environment Variables Configuration

Configure the Upstash Redis credentials in `apps/api/.env` and `apps/worker/.env`:

```env
# Upstash Redis Configuration
UPSTASH_REDIS_HOST=your-database-id.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=your_upstash_password
UPSTASH_REDIS_TLS=true

# Alternatively, the full rediss:// URI format is also supported:
# REDIS_URL=rediss://default:your_upstash_password@your-database-id.upstash.io:6379
```

> **Security Guardrail**: Redis credentials must stay strictly on backend services (`apps/api` and `apps/worker`). They are never exposed to the frontend (`apps/web`).

---

## 3. BullMQ Integration Details

BullMQ connects directly to the managed Upstash Redis instance using `ioredis`.

According to official BullMQ requirements:

- `maxRetriesPerRequest: null` is strictly enforced.
- TLS is configured via `{ tls: { rejectUnauthorized: true } }` when `UPSTASH_REDIS_TLS=true`.
- **Producers**: Enqueue execution jobs inside `apps/api`.
- **Consumers**: Process jobs inside the standalone `apps/worker` service.
