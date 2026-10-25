# Database Schema (MongoDB)

## 1. Conventions

- Use Mongoose models with explicit schema validation.
- Use BSON `ObjectId` references for cross-collection relationships.
- Store timestamps in UTC using `createdAt` and `updatedAt`.
- Add `organizationId` to every organization-owned resource.
- Every query for tenant-owned data must include `organizationId` from the authenticated context.
- Add compound indexes for common access patterns.
- Prefer immutable snapshots for interview question versions and submissions.
- Avoid embedding unbounded arrays (events, submissions, messages) in a single document.

## 2. Collections

### users

```js
{
  _id: ObjectId,
  email: String,              // normalized, unique
  passwordHash: String,
  displayName: String,
  avatarUrl: String,          // optional Cloudinary URL
  emailVerifiedAt: Date,      // nullable
  status: "active" | "disabled",
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- Unique `{ email: 1 }`.
- `{ status: 1 }`.

Do not store raw passwords, refresh tokens, or provider secrets.

### refreshTokens

```js
{
  _id: ObjectId,
  userId: ObjectId,
  tokenHash: String,
  familyId: String,
  expiresAt: Date,
  revokedAt: Date,
  replacedByTokenId: ObjectId,
  createdAt: Date,
  lastUsedAt: Date
}
```

Indexes:

- `{ userId: 1, familyId: 1 }`.
- TTL on `expiresAt` where appropriate. Revocation/audit semantics must be considered before TTL cleanup.

### organizations

```js
{
  _id: ObjectId,
  name: String,
  slug: String,
  ownerUserId: ObjectId,
  status: "active" | "suspended",
  settings: {
    defaultInterviewDurationMinutes: Number,
    recordingEnabled: Boolean,  // policy default; consent still required
    allowedLanguages: [String],
    dataRetentionDays: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- Unique `{ slug: 1 }`.
- `{ ownerUserId: 1 }`.

### memberships

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  userId: ObjectId,
  role: "owner" | "admin" | "interviewer",
  status: "active" | "suspended",
  invitedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- Unique `{ organizationId: 1, userId: 1 }`.
- `{ userId: 1, status: 1 }`.

Candidates may be external invitees and need not be organization members.

### invitations

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  email: String,
  invitedRole: "admin" | "interviewer",
  tokenHash: String,
  invitedBy: ObjectId,
  expiresAt: Date,
  acceptedAt: Date,
  revokedAt: Date,
  createdAt: Date
}
```

Indexes:

- `{ organizationId: 1, email: 1, acceptedAt: 1 }`.
- TTL on expired invitations if compatible with audit requirements; otherwise retain and clean via scheduled policy.

### interviews

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  title: String,
  description: String,
  candidate: {
    userId: ObjectId,         // optional if candidate has an account
    name: String,
    email: String
  },
  interviewerIds: [ObjectId],
  questionSnapshots: [{
    questionId: ObjectId,
    version: Number,
    title: String,
    statement: String,
    constraints: [String],
    examples: [{ input: String, output: String, explanation: String }],
    allowedLanguages: [String],
    timeLimitMs: Number,
    memoryLimitMb: Number,
    starterCodeByLanguage: Map
  }],
  scheduledStartAt: Date,
  scheduledEndAt: Date,
  timezone: String,
  status: "draft" | "scheduled" | "waiting" | "live" | "completed" | "cancelled",
  joinCredentialHash: String,
  startedAt: Date,
  endedAt: Date,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- `{ organizationId: 1, scheduledStartAt: -1 }`.
- `{ organizationId: 1, status: 1, scheduledStartAt: 1 }`.
- `{ interviewerIds: 1, scheduledStartAt: 1 }`.

Do not store a raw reusable candidate join secret. Store a hash or use a dedicated invitation collection with single-use/expiry semantics.

### questions

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  createdBy: ObjectId,
  title: String,
  slug: String,
  difficulty: "easy" | "medium" | "hard",
  tags: [String],
  versions: [{
    version: Number,
    statement: String,
    constraints: [String],
    examples: [{ input: String, output: String, explanation: String }],
    allowedLanguages: [String],
    starterCodeByLanguage: Map,
    publicTests: [{ input: String, expectedOutput: String }],
    hiddenTests: [{ input: String, expectedOutput: String }],
    timeLimitMs: Number,
    memoryLimitMb: Number,
    createdBy: ObjectId,
    createdAt: Date
  }],
  archivedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- `{ organizationId: 1, updatedAt: -1 }`.
- `{ organizationId: 1, slug: 1 }` (unique if slug uniqueness is required).

Security note: never serialize the full question document to candidate endpoints. Use a candidate-safe DTO that excludes hidden tests and expected outputs. For larger test bundles, store encrypted/private references accessible only to execution workers rather than embedding them in ordinary API reads.

### submissions

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  interviewId: ObjectId,
  questionId: ObjectId,
  candidateUserId: ObjectId, // nullable for guest candidate
  language: "javascript" | "python" | "cpp",
  sourceCode: String,
  documentVersion: Number,
  idempotencyKey: String,
  status: "queued" | "running" | "completed" | "system_error",
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- Unique `{ organizationId: 1, interviewId: 1, idempotencyKey: 1 }`.
- `{ interviewId: 1, createdAt: -1 }`.
- `{ organizationId: 1, candidateUserId: 1, createdAt: -1 }`.

If source code size becomes large, move immutable source snapshots to private object storage and retain a content hash/reference in MongoDB. Do not use Cloudinary for this.

### executionResults

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  submissionId: ObjectId,
  jobId: String,
  status: "passed" | "failed" | "compile_error" | "runtime_error" |
          "time_limit_exceeded" | "memory_limit_exceeded" | "system_error",
  passedCount: Number,
  failedCount: Number,
  totalCount: Number,
  durationMs: Number,
  peakMemoryMb: Number,
  exitCode: Number,
  stdout: String,             // bounded and sanitized
  stderr: String,             // bounded and sanitized
  publicTestResults: [{
    testIndex: Number,
    passed: Boolean,
    actualOutput: String      // bounded; no hidden expected output
  }],
  createdAt: Date
}
```

Indexes:

- `{ submissionId: 1, createdAt: -1 }`.
- `{ organizationId: 1, createdAt: -1 }`.

Never include hidden test input, expected output, or private harness details in results exposed to candidates.

### evaluations

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  interviewId: ObjectId,
  interviewerId: ObjectId,
  rubricVersion: Number,
  criteria: [{
    key: String,
    label: String,
    score: Number,
    maxScore: Number,
    evidence: [{
      type: "submission" | "interview_event" | "note",
      referenceId: ObjectId,
      explanation: String
    }]
  }],
  overallNotes: String,
  recommendation: "strong_yes" | "yes" | "mixed" | "no" | "strong_no" | "not_provided",
  status: "draft" | "submitted",
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- `{ organizationId: 1, interviewId: 1 }`.
- `{ interviewerId: 1, updatedAt: -1 }`.

Recommendation is a human-entered field. Do not derive it automatically from model output.

### interviewEvents

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  interviewId: ObjectId,
  actorUserId: ObjectId,
  type: String,
  payload: Object,            // allowlisted, validated event-specific fields
  occurredAt: Date
}
```

Indexes:

- `{ interviewId: 1, occurredAt: 1 }`.
- `{ organizationId: 1, type: 1, occurredAt: -1 }`.

Keep events append-only where practical. Do not store access tokens, secrets, or unrestricted raw payloads.

### mediaAssets (optional)

```js
{
  _id: ObjectId,
  organizationId: ObjectId,
  interviewId: ObjectId,
  provider: "cloudinary" | "livekit" | "r2",
  providerAssetId: String,
  resourceType: String,
  playbackUrl: String,        // avoid public permanent URLs for private recordings
  consentRecordedAt: Date,
  retentionExpiresAt: Date,
  createdAt: Date
}
```

Use signed/private delivery and enforce authorization before issuing playback access. Cloudinary is optional and should be selected based on recording workflow, format, privacy, and cost.

## 3. Data ownership and relationship summary

- User belongs to organizations through `memberships`.
- Organization owns interviews, questions, submissions, evaluations, and audit events.
- Interview references interviewer IDs and a candidate identity.
- Interview contains immutable question snapshots to preserve what was asked.
- Submission belongs to one interview and question snapshot.
- Execution result belongs to a submission.
- Evaluation belongs to an interview and is authored by an interviewer.
- Media asset is optional and belongs to an interview.

## 4. Tenant isolation rules

1. Resolve organization membership from authenticated identity and requested organization.
2. Never accept `organizationId` as trusted authorization input from the request body.
3. Include organization scope in every query and update.
4. Verify that interview, question, submission, and evaluation all belong to the same organization.
5. Verify candidate access through the invitation/interview relationship.
6. Use explicit DTO serializers for candidate, interviewer, and admin responses.
7. Add automated cross-tenant access tests for every resource family.

## 5. MongoDB transaction considerations

Use transactions for multi-document operations that must be atomic, such as accepting an invitation and creating a membership, or finalizing an evaluation and recording its audit event. Transactions require a replica set. For a local development environment, configure MongoDB as a single-node replica set if transactions are part of the test path.

Do not make the entire interview event stream a giant embedded array. Use append-only event documents and periodic document snapshots for collaboration state.
