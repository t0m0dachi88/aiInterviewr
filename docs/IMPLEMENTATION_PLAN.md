# Implementation Plan

## 1. Delivery approach

Build Stage B in vertical, testable slices. Each phase must include backend, frontend, tests, and a demonstrable outcome. Keep the execution worker separate from the Express API from the beginning.

Do not start with microservices. Use a modular monolith for the control plane and separately deployed worker/realtime processes where isolation or scaling requires it.

## 2. Phase 0 — Repository and engineering foundation

### Backend

- Initialize Node.js project and Express application.
- Add environment validation and configuration.
- Connect MongoDB using Mongoose.
- Add Redis connection and BullMQ setup.
- Add structured logging, request IDs, centralized error handling.
- Establish module conventions and lint/format scripts.

### Frontend

- Initialize React + TypeScript application.
- Add routing, layout, API client, auth state strategy.
- Establish design tokens and reusable UI components.

### Dev environment

- Docker Compose for local MongoDB replica set (if transactions are used), Redis, and application dependencies.
- `.env.example` with placeholders only.
- Health/readiness endpoints.
- CI workflow for lint, type-check (frontend), tests, and build.

### Tests / exit criteria

- API starts and reports health.
- MongoDB and Redis connectivity are tested.
- CI passes on a clean checkout.
- No secrets are committed.

## 3. Phase 1 — Authentication and organizations

### Backend

- User registration/login/logout/refresh.
- Password hashing and refresh-token rotation.
- Organization creation.
- Membership and invitation lifecycle.
- Role and organization-scope middleware.

### Frontend

- Register/login screens.
- Organization creation/switcher.
- Member list and invite form.
- Protected routes.

### Tests / exit criteria

- Authentication unit and integration tests.
- Refresh-token reuse/revocation tests.
- Cross-organization access tests.
- Owner/admin/interviewer permission matrix.
- A user can create an organization and invite an interviewer.

## 4. Phase 2 — Interview management

### Backend

- Interview CRUD and lifecycle.
- Candidate invitation and expiring join credentials.
- Interviewer assignment.
- Question CRUD and versioning.
- Immutable question snapshot attached to interview.

### Frontend

- Interview dashboard.
- Create/edit/schedule interview.
- Candidate invitation flow.
- Interview detail and waiting-room screens.
- Question selection and configuration.

### Tests / exit criteria

- Interview lifecycle state-transition tests.
- Unauthorized candidate/interviewer join tests.
- Question snapshot regression tests.
- A company can schedule an interview and invite a candidate.

## 5. Phase 3 — Coding workspace

### Backend

- Submission API and immutable source snapshot.
- Idempotency handling.
- Submission history endpoints.
- Candidate-safe question/result DTOs.

### Frontend

- Monaco integration.
- Language selector for JavaScript, Python, C++.
- Problem statement and examples panel.
- Editor state persistence.
- Run/submit controls and submission timeline.

### Tests / exit criteria

- Source persistence and version association.
- Payload validation and size limits.
- Duplicate idempotency key behavior.
- Hidden test data cannot be serialized to candidate API.
- A candidate can edit code and submit a saved snapshot (execution may still be stubbed in this phase).

## 6. Phase 4 — Execution infrastructure

This phase requires a threat model and security review before exposing it to external users.

### Backend / queue

- BullMQ queue and typed job payload.
- Job status lifecycle and retry policy.
- Per-organization quotas and global concurrency controls.
- Worker heartbeat and dead-letter handling.

### Worker

- Separate worker process/deployment.
- Disposable sandbox manager.
- JavaScript runtime.
- Python runtime.
- C++ compile-and-run toolchain.
- CPU, memory, PID, filesystem, output, and wall-time limits.
- Network disabled by default.
- Guaranteed cleanup on success, error, timeout, and worker cancellation.

### Frontend

- Queued/running/completed states.
- Public test result display.
- Sanitized compile/runtime output.
- Submission history and result detail.

### Tests / exit criteria

- Unit tests for runtime adapters.
- Integration tests for each language.
- Timeout and memory-limit tests.
- Output-flooding test.
- Network-denial test.
- Concurrent job test.
- Worker crash and cleanup test.
- Hidden test leakage tests.
- Security review of container flags, mounts, capabilities, namespaces, and worker host configuration.

Do not run untrusted candidate code on a developer laptop or the same host that contains production secrets. Before real external usage, deploy workers to isolated compute and evaluate gVisor or Firecracker.

## 7. Phase 5 — Live collaboration

### Backend / realtime

- Socket.IO room authorization and presence.
- Yjs provider/service for editor document updates.
- Durable snapshots/update persistence.
- Interview event log.
- Interviewer edit-permission controls.
- Reconnection and state recovery.

### Frontend

- Shared Monaco/Yjs binding.
- Remote cursors and selections.
- Participant list and connection state.
- Chat.
- Interviewer controls and candidate edit lock.

### Tests / exit criteria

- Two browser clients converge to the same document.
- Simultaneous edits do not lose data.
- Unauthorized users cannot join or subscribe.
- Reconnect recovers latest document state.
- Permission changes take effect server-side.
- Realtime event ordering and duplicate handling are tested.

## 8. Phase 6 — Voice, video, and screen sharing

### Backend

- LiveKit room/token service.
- Room-scoped participant grants.
- Verified webhooks.
- Recording consent state and audit events.

### Frontend

- Camera/microphone controls.
- Participant tiles.
- Screen sharing.
- Connection-quality indicators.
- Device selection and permission-error handling.
- Text fallback.

### Tests / exit criteria

- Authorized participants can join the correct media room.
- Expired/incorrect tokens are rejected.
- Cross-interview room access is denied.
- Screen sharing works in supported browsers.
- Reconnect and device permission failures are handled.
- Recording remains disabled unless explicitly enabled and consent requirements are met.

## 9. Phase 7 — Evaluation and audit

### Backend

- Rubric templates and versions.
- Draft and submitted evaluations.
- Evidence references to submissions and interview events.
- Append-only audit events for critical actions.

### Frontend

- Interviewer notes.
- Rubric scoring.
- Evidence-linked evaluation view.
- Final report for authorized organization members.

### Tests / exit criteria

- Candidate cannot access interviewer-only notes.
- Only authorized interviewers can submit evaluations.
- Evaluation changes are auditable.
- Human decision is required; no automatic hiring decision is produced.

## 10. Stage B release gate

Do not call Stage B production-ready until:

- Tenant-isolation tests pass.
- Execution threat model and sandbox review are complete.
- Resource limits and cleanup are verified under load.
- Queue backlog and worker health are observable.
- Realtime reconnect and document recovery are tested.
- Media token authorization is tested.
- Data retention and recording consent policies are documented.
- Backup/restore and incident-response procedures exist.
- Rate limits, security headers, CORS, secrets management, and dependency scanning are configured.

## 11. Stage C — AI interviewer copilot

Build only after Stage B produces reliable structured evidence.

1. Provider abstraction and organization-level AI configuration.
2. JD-to-assessment blueprint draft.
3. Question/follow-up suggestion service.
4. Code failure and complexity explanation.
5. Interview note organization against rubric.
6. Evidence-linked summary draft.
7. Human review, edit, and approval workflow.
8. Audit AI inputs, outputs, model/provider, and reviewer actions.

AI must not decide whether a candidate is hired or rejected. AI-generated content must be labeled as suggestions and traceable to evidence.

## 12. Suggested delivery cadence

Estimate effort only after repository setup and team capacity are known. Prioritize phase exit criteria over calendar promises. A small team should avoid parallelizing tightly coupled features before the API contracts and data model are stable.

For every phase:

- Write/confirm acceptance criteria.
- Implement backend contract.
- Add backend tests.
- Implement frontend flow.
- Add end-to-end tests.
- Update architecture and status documents.
- Demo the working vertical slice.
- Review security and privacy impact before moving on.
