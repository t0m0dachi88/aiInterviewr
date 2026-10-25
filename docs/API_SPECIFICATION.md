# API Specification

## 1. API conventions

Base path: `/api/v1`

- JSON request/response bodies.
- Bearer access token for authenticated endpoints.
- Refresh token delivered through a secure, HttpOnly, SameSite cookie where feasible.
- All organization-scoped routes enforce membership and resource authorization.
- Use a consistent error envelope.
- Validate request bodies, params, and query strings.
- Paginate list endpoints with cursor or bounded page-based pagination.
- Use `Idempotency-Key` for submission creation and other retry-sensitive operations.

### Standard success envelope

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Standard error envelope

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "requestId": "req_..."
  }
}
```

Do not return stack traces, secrets, hidden test data, internal container paths, or provider credentials.

## 2. Authentication

| Method | Endpoint             | Purpose                                     |
| ------ | -------------------- | ------------------------------------------- |
| POST   | `/auth/register`     | Create user account                         |
| POST   | `/auth/login`        | Authenticate                                |
| POST   | `/auth/refresh`      | Rotate refresh token                        |
| POST   | `/auth/logout`       | Revoke current refresh-token family/session |
| POST   | `/auth/verify-email` | Verify email                                |
| GET    | `/auth/me`           | Current user profile                        |

## 3. Organizations and memberships

| Method | Endpoint                                         | Purpose                            |
| ------ | ------------------------------------------------ | ---------------------------------- |
| POST   | `/organizations`                                 | Create organization                |
| GET    | `/organizations`                                 | List organizations user belongs to |
| GET    | `/organizations/:organizationId`                 | Organization details               |
| PATCH  | `/organizations/:organizationId`                 | Update organization settings       |
| POST   | `/organizations/:organizationId/invitations`     | Invite interviewer/admin           |
| GET    | `/organizations/:organizationId/members`         | List members                       |
| PATCH  | `/organizations/:organizationId/members/:userId` | Change membership role/status      |
| DELETE | `/organizations/:organizationId/members/:userId` | Remove member                      |
| POST   | `/invitations/:token/accept`                     | Accept invitation                  |

## 4. Interviews

| Method | Endpoint                                    | Purpose                                                       |
| ------ | ------------------------------------------- | ------------------------------------------------------------- |
| POST   | `/organizations/:organizationId/interviews` | Create interview                                              |
| GET    | `/organizations/:organizationId/interviews` | List interviews                                               |
| GET    | `/interviews/:interviewId`                  | Interview detail, role-filtered                               |
| PATCH  | `/interviews/:interviewId`                  | Update scheduled interview                                    |
| POST   | `/interviews/:interviewId/invitations`      | Invite candidate                                              |
| POST   | `/interviews/:interviewId/cancel`           | Cancel interview                                              |
| POST   | `/interviews/:interviewId/start`            | Start interview (authorized interviewer)                      |
| POST   | `/interviews/:interviewId/end`              | End interview (authorized interviewer)                        |
| POST   | `/interviews/:interviewId/join-token`       | Exchange invitation/session credential for scoped room access |

Candidate invitation links should contain an opaque, expiring secret. Store only a hash server-side and exchange it for a short-lived session credential. Do not put permanent access tokens in URLs.

## 5. Questions

| Method | Endpoint                                         | Purpose                                 |
| ------ | ------------------------------------------------ | --------------------------------------- |
| POST   | `/organizations/:organizationId/questions`       | Create question                         |
| GET    | `/organizations/:organizationId/questions`       | List questions                          |
| GET    | `/questions/:questionId`                         | Role-filtered question detail           |
| PATCH  | `/questions/:questionId`                         | Create/update a question version        |
| POST   | `/interviews/:interviewId/questions`             | Attach question snapshot                |
| DELETE | `/interviews/:interviewId/questions/:questionId` | Detach question before interview starts |

Candidate-facing question DTOs must exclude hidden test cases and expected outputs. Execution workers obtain hidden test data through a private internal path.

## 6. Submissions and execution

| Method | Endpoint                                                     | Purpose                                      |
| ------ | ------------------------------------------------------------ | -------------------------------------------- |
| POST   | `/interviews/:interviewId/questions/:questionId/submissions` | Create submission and enqueue execution      |
| GET    | `/submissions/:submissionId`                                 | Get role-filtered submission status/result   |
| GET    | `/interviews/:interviewId/submissions`                       | List submissions for authorized interviewers |
| GET    | `/submissions/:submissionId/result`                          | Get permitted execution result               |
| GET    | `/interviews/:interviewId/submissions/:submissionId/source`  | Get source snapshot if authorized            |

### Submission request

```http
POST /api/v1/interviews/{interviewId}/questions/{questionId}/submissions
Authorization: Bearer <access-token>
Idempotency-Key: <unique-client-generated-key>
Content-Type: application/json
```

```json
{
  "language": "python",
  "sourceCode": "print('hello')",
  "documentVersion": 42
}
```

### Submission response

Return `202 Accepted` because execution is asynchronous.

```json
{
  "success": true,
  "data": {
    "submissionId": "ObjectId",
    "status": "queued"
  }
}
```

Execution outcomes:

- `queued`
- `running`
- `passed`
- `failed`
- `compile_error`
- `runtime_error`
- `time_limit_exceeded`
- `memory_limit_exceeded`
- `system_error`

Candidate responses may include public test outcomes and sanitized compiler/runtime output. They must not include hidden test inputs, expected outputs, or internal harness details.

## 7. Evaluations

| Method | Endpoint                                     | Purpose                                     |
| ------ | -------------------------------------------- | ------------------------------------------- |
| GET    | `/interviews/:interviewId/rubric`            | Get rubric template                         |
| PUT    | `/interviews/:interviewId/evaluation`        | Save/update interviewer draft               |
| POST   | `/interviews/:interviewId/evaluation/submit` | Submit final human evaluation               |
| GET    | `/interviews/:interviewId/evaluations`       | List evaluations for authorized hiring team |

## 8. Media / LiveKit

| Method | Endpoint                                     | Purpose                          |
| ------ | -------------------------------------------- | -------------------------------- |
| POST   | `/interviews/:interviewId/media-token`       | Issue scoped LiveKit token       |
| POST   | `/webhooks/livekit`                          | Receive verified LiveKit webhook |
| POST   | `/interviews/:interviewId/recording-consent` | Record participant consent state |

The backend must authorize the participant before issuing a LiveKit token. Token grants should be restricted to the relevant room and participant identity. Verify webhook signatures using the provider SDK.

## 9. Realtime events

Use Socket.IO namespaces/rooms with server-side authorization. Event names and payloads are versioned and validated.

### Client -> server

| Event                       | Purpose                        | Key payload                                 |
| --------------------------- | ------------------------------ | ------------------------------------------- |
| `room:join`                 | Join authorized interview room | `{ interviewId }`                           |
| `room:leave`                | Leave room                     | `{ interviewId }`                           |
| `chat:send`                 | Send room message              | `{ interviewId, message, clientMessageId }` |
| `editor:permission-request` | Request permission change      | `{ interviewId, canCandidateEdit }`         |
| `interview:control`         | Authorized interviewer action  | `{ interviewId, action }`                   |
| `presence:update`           | Update activity state          | `{ interviewId, state }`                    |

### Server -> client

| Event                       | Purpose                  | Key payload                                 |
| --------------------------- | ------------------------ | ------------------------------------------- |
| `room:participant-joined`   | Participant joined       | `{ userId, displayName, role }`             |
| `room:participant-left`     | Participant left         | `{ userId }`                                |
| `room:presence`             | Presence snapshot/update | `{ participants }`                          |
| `chat:message`              | New chat message         | `{ messageId, sender, message, createdAt }` |
| `editor:permission-changed` | Editor access changed    | `{ canCandidateEdit, changedBy }`           |
| `submission:queued`         | Submission accepted      | `{ submissionId, status }`                  |
| `submission:started`        | Worker started           | `{ submissionId, status }`                  |
| `submission:completed`      | Execution finished       | `{ submissionId, status, resultSummary }`   |
| `interview:started`         | Interview started        | `{ interviewId, startedAt }`                |
| `interview:ended`           | Interview ended          | `{ interviewId, endedAt }`                  |

### Yjs document events

Use a compatible Yjs WebSocket provider for document updates and awareness. Do not send full editor contents as ordinary Socket.IO events on every keystroke. Persist snapshots/updates through the collaboration service and authorize document access at connection time and on reconnect.

## 10. Security and validation requirements

- Apply authentication middleware before organization/resource authorization.
- Check role and ownership on every route and socket event.
- Validate ObjectId format and resource ownership.
- Limit request body sizes and source-code size.
- Allowlist languages and execution profiles.
- Sanitize/limit stdout and stderr.
- Rate-limit login, invitation, join-token, and submission endpoints.
- Use CORS allowlists and secure headers.
- Protect webhook endpoints with signature verification.
- Never expose hidden test fields through generic Mongoose serialization.
- Do not trust `userId`, `role`, `organizationId`, or `candidateId` supplied by clients.
- Return 404 for inaccessible resources where that reduces resource enumeration.
