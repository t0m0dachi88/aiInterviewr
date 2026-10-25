# Project Requirements

## 1. Product overview

**Working product:** AI-powered Technical Hiring Infrastructure  
**Initial product (Stage B):** Live technical interview platform  
**Long-term product (Stage C):** AI-native hiring infrastructure

The platform enables companies to create and manage technical interviews where candidates and interviewers collaborate in a live coding environment, execute code against test cases, communicate through voice/video, and produce structured, human-reviewed evaluation records.

The initial release is infrastructure-first. AI features are deliberately excluded from the critical hiring decision path and introduced in Stage C as interviewer assistance only.

## 2. Product goals

1. Let an organization create and schedule technical interviews.
2. Let candidates and interviewers join an authorized live interview room.
3. Provide a collaborative code editor for JavaScript, Python, and C++.
4. Execute untrusted candidate code in isolated, resource-limited environments.
5. Support public and hidden test cases without exposing hidden test data.
6. Provide real-time voice, video, and screen-sharing capability.
7. Preserve submissions, execution outcomes, interview events, and human evaluation.
8. Keep the architecture extensible for AI-assisted workflows and additional languages.

## 3. Users and roles

### Organization owner / administrator

- Creates and manages an organization.
- Invites and removes members.
- Assigns organization-level roles.
- Manages organization settings and interview access.

### Interviewer

- Creates and schedules interviews.
- Selects questions and configures test cases.
- Joins interview rooms.
- Uses interviewer-only controls and notes.
- Completes the evaluation rubric.

### Candidate

- Joins an interview using a valid invitation.
- Uses the shared editor and execution interface.
- Communicates with the interviewer.
- Sees only candidate-visible questions, tests, and execution feedback.

A user may have different roles in different organizations. Authorization must be scoped to the organization and resource, not based only on a global role string.

## 4. Stage B functional requirements

### 4.1 Authentication and identity

- Register and sign in using email and password.
- Hash passwords using Argon2id or bcrypt with an appropriate work factor.
- Issue short-lived access tokens and rotating refresh tokens.
- Support logout and refresh-token revocation.
- Verify email before enabling organization-owner actions (configurable).
- Enforce rate limits on authentication endpoints.
- Do not store raw refresh tokens; store a hash or token-family identifier.

### 4.2 Organizations and membership

- Create an organization.
- Invite users by email.
- Accept, revoke, and expire invitations.
- Assign owner, admin, and interviewer roles.
- Enforce tenant isolation for every organization-owned resource.
- Record security-sensitive membership changes in the audit trail.

### 4.3 Interview management

- Create, update, cancel, and list interviews.
- Assign one or more interviewers.
- Invite a candidate.
- Set start/end time, timezone, instructions, and interview status.
- Associate one or more questions with an interview.
- Generate a single-use or controlled-use join credential for candidates.
- Support scheduled, waiting, live, completed, and cancelled states.
- Prevent unauthorized users from joining or viewing interview data.

### 4.4 Question and assessment management

- Create reusable coding questions.
- Store statement, constraints, examples, supported languages, starter code, and time/memory limits.
- Store public and hidden test cases separately in the data model and access layer.
- Version questions or snapshot question content when attached to an interview so later edits do not silently change an active interview.
- Never send hidden test inputs or expected outputs to the candidate client.

### 4.5 Live interview room

- Join and leave a room with authorized credentials.
- Display participant presence and connection state.
- Synchronize editor content between candidate and interviewer.
- Display live cursors and selections where supported.
- Provide interviewer controls to start/end the interview and manage candidate editing permissions.
- Provide text chat or session messages as a fallback to voice/video.
- Reconnect after transient network failure and recover the latest document state.
- Record important room events with timestamps.

### 4.6 Code editor and submission

- Integrate Monaco Editor.
- Support JavaScript, Python, and C++ in the first execution release.
- Allow candidate and interviewer to edit according to room permissions.
- Save document snapshots or versioned updates.
- Allow explicit code submission and execution.
- Associate each submission with interview, question, candidate, language, and document version.
- Show queue status, execution status, public test results, and safe error output.
- Preserve submission history.

### 4.7 Code execution

- Accept only supported language identifiers and validated source payloads.
- Enqueue execution jobs; never execute candidate code in the Express API process.
- Run each execution in a fresh, disposable sandbox.
- Enforce CPU, memory, process-count, file-size, and wall-clock limits.
- Disable outbound network access by default.
- Run as a non-root user with no privileged mode, no host Docker socket, and no unnecessary capabilities.
- Use a read-only base filesystem where practical and a bounded temporary working directory.
- Apply queue concurrency limits and per-organization quotas.
- Kill timed-out processes and destroy the sandbox even after failures.
- Keep hidden test data on the worker side.
- Return normalized outcomes: queued, running, passed, failed, compile_error, runtime_error, time_limit_exceeded, memory_limit_exceeded, system_error.
- Treat Docker as one layer of isolation, not a complete security guarantee. Evaluate gVisor or Firecracker before accepting arbitrary public workloads.

### 4.8 Voice, video, and screen sharing

- Use a WebRTC-based media platform such as LiveKit.
- Backend issues short-lived room-scoped access tokens after authorization.
- Support camera, microphone, participant mute state, and screen sharing.
- Make recording opt-in and clearly disclosed; do not record by default.
- Store media recordings only if enabled and permitted by organization policy and applicable law.
- Provide a text/chat fallback when media fails.
- Do not route media streams through the Express application server.

### 4.9 Evaluation

- Provide configurable evaluation rubrics.
- Support criteria such as problem solving, correctness, code quality, communication, debugging, and complexity analysis.
- Allow interviewer notes linked to rubric criteria and interview events/submissions.
- Store ratings and written evidence separately.
- Require a human interviewer to submit the final evaluation.
- Do not automatically reject, rank, or hire candidates.

### 4.10 Auditability

Record security- and hiring-relevant events, including:

- Login/security events.
- Organization membership and role changes.
- Interview creation, invitation, cancellation, start, and completion.
- Participant joins and leaves.
- Submission creation and execution outcome.
- Interviewer control changes.
- Evaluation creation and updates.
- Recording consent and recording lifecycle events, if recording is enabled.

## 5. Stage C functional requirements (future)

- Convert a job description into a draft assessment blueprint.
- Generate question and follow-up suggestions for interviewer review.
- Explain compiler/runtime errors and potential edge cases.
- Explain time and space complexity as suggestions, not authoritative grades.
- Organize interviewer notes against rubric criteria.
- Summarize evidence from code versions, test outcomes, and interviewer notes.
- Link generated claims to the underlying evidence.
- Require human review and approval before any evaluation report is finalized.
- Never let an LLM make the final hiring decision.

## 6. Non-functional requirements

### Security

- Tenant isolation and resource-level authorization.
- Strict validation of all API and socket payloads.
- CSRF protection where cookie-based authentication is used.
- Secure CORS policy, Helmet, rate limiting, and request-size limits.
- Secrets stored in environment/secret management, never committed.
- Encryption in transit; encryption at rest through managed infrastructure where available.
- No secrets or hidden test data in client logs.
- Dependency scanning and regular image updates.
- Separate control-plane and execution-plane credentials and networks.

### Reliability

- Queue-backed execution with retry policy only for infrastructure failures, not blindly for candidate code failures.
- Idempotency keys for submission creation.
- Graceful worker shutdown and job recovery.
- WebSocket reconnect and document-state recovery.
- Health/readiness endpoints and structured logs.

### Performance targets (initial design targets, to validate)

- Typical API response under 300 ms at p95 excluding external providers and long-running work.
- Room event propagation under 250 ms in a regional deployment under normal network conditions.
- Execution queue acknowledgement under 500 ms under normal load.
- Do not promise code execution latency until measured on the target worker hardware.

### Maintainability

- Modular monolith with clear module boundaries.
- Controllers remain thin; business logic lives in services.
- Mongoose models/repositories stay behind module interfaces.
- Shared validation and error contracts.
- Automated unit, integration, contract, and end-to-end tests.

### Privacy and retention

- Define retention periods for code, logs, notes, and recordings.
- Support deletion/export workflows subject to audit and legal retention needs.
- Avoid collecting candidate data not needed for hiring.
- Recording requires clear notice and consent according to applicable law and company policy.

## 7. Out of scope for Stage B

- Automated candidate ranking or hiring recommendations.
- AI-generated interview questions in the live critical path.
- Resume parsing and applicant tracking system replacement.
- Payment/subscription billing.
- Native mobile applications.
- Large-scale proctoring or biometric identity verification.
- Arbitrary package installation or unrestricted internet access in sandboxes.

## 8. Acceptance criteria for the first usable release

A release is considered usable when:

1. An organization owner can create an organization and invite an interviewer.
2. An interviewer can create an interview and invite a candidate.
3. Authorized participants can join the same room.
4. Both participants can collaborate in the same editor with recoverable document state.
5. Participants can communicate using voice/video and screen sharing.
6. Candidate code can be queued and run in a disposable sandbox for all three supported languages.
7. Public tests and hidden tests are evaluated without leaking hidden test data.
8. Results are visible to authorized participants according to role.
9. Submissions and important room events are persisted.
10. An interviewer can complete a rubric and submit a human-authored evaluation.
11. Cross-organization access attempts are rejected and covered by automated tests.
12. Worker failure, timeout, and cleanup paths are tested.
