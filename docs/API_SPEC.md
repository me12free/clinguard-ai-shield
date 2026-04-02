# ClinGuard API Specification

Backend: Laravel (MySQL). All persistence via this API; no Supabase or other backends.

Base URL: `VITE_API_URL` (e.g. `http://127.0.0.1:8000`). Protected routes require `Authorization: Bearer <token>`.

---

## Authentication

### POST /login

Request:

```json
{ "email": "user@example.com", "password": "..." }
```

Response (200):

```json
{ "token": "...", "user": { "id": 1, "name": "...", "email": "..." } }
```

Errors: 422 validation, 401 invalid credentials.

---

### POST /register

Request:

```json
{ "name": "...", "email": "user@example.com", "password": "...", "password_confirmation": "..." }
```

Response (201):

```json
{ "token": "...", "user": { "id": 1, "name": "...", "email": "..." } }
```

Errors: 422 validation.

---

### POST /api/logout (protected)

Headers: `Authorization: Bearer <token>`.

Response (200): `{ "message": "Logged out" }`.

---

## Protected API (require Bearer token)

### GET /api/user

Response (200): `{ "id", "name", "email", "email_verified_at", "created_at", "updated_at", "role_id", "organization_id", "role": { "id", "role_name", "permissions": [] } }`. Used by the frontend to show/hide sections by permission.

---

### POST /api/detect

Request:

```json
{ "text": "Clinical note with potential PHI..." }
```

Response (200):

```json
{
  "spans": [
    { "start": 0, "end": 5, "category": "NAME", "text": "John" }
  ]
}
```

Errors: 422 validation, 401 unauthorized.

---

### POST /api/chat

Request:

```json
{ "prompt": "User's clinical prompt or question...", "bypass_phi": false }
```

- `bypass_phi` (optional, boolean): When true and the user is allowed (config or role permission), PHI detection and redaction are skipped; the original prompt is sent to the AI and an audit event `chat_bypass` is recorded. When true but not allowed, the API returns 403.

Response (200):

```json
{
  "response": "AI response text",
  "spans": [ { "start", "end", "category", "text" } ],
  "rag_context": [ { "content": "..." } ],
  "redacted_prompt": "Prompt with [REDACTED-*] placeholders"
}
```

Errors: 422 validation, 401 unauthorized, 500 server/detection/OpenAI errors.

---

### GET /api/policies (protected)

Query: optional `organization_id`. Returns policies for the authenticated user's organization.

Response (200): `{ "data": [ { "id", "organization_id", "policy_name", "phi_categories", "enforcement_action", "confidence_threshold", "created_at", "updated_at" } ] }`.

---

### PUT /api/policies/{id} (protected)

Request: `{ "policy_name", "phi_categories", "enforcement_action", "confidence_threshold" }` (all optional).

Response (200): updated policy object.

Errors: 403, 404, 422.

---

### GET /api/conversations (protected, permission: view_own_conversations)

Response (200): `{ "data": [ { "id", "prompt_redacted", "response_summary", "created_at" } ] }`.

---

### GET /api/audit-events (protected, permission: audit)

Query: optional `event_type`. Response (200): `{ "data": [ { "id", "user_id", "organization_id", "event_type", "detected_categories", "created_at" } ] }`.

---

### GET /api/users (protected, permission: users)

Response (200): `{ "data": [ { "id", "name", "email", "role_id", "organization_id", ... } ] }`.

---

### PUT /api/users/{id} (protected, permission: users)

Request: `{ "name", "role_id", "organization_id" }` (optional). Response (200): updated user. 404 if not found or different org.

---

### GET /api/organizations (protected, permission: organizations)

Response (200): `{ "data": [ { "id", "name", "subscription_tier", ... } ] }`.

---

### PUT /api/organizations/{id} (protected, permission: organizations)

Request: `{ "name", "subscription_tier", "configuration" }` (optional). Response (200): updated organization.

---

### GET /api/reports/summary (protected)

Requires **any one of**: `view_own_conversations`, `audit`, `organizations` (middleware OR).

Response (200): JSON with `scope` (`personal` | `organization` | `global`), `scope_label`, `kpis`, `series` (daily counts, `audit_by_event_type`), `composed_daily`, `tables`, `breakdowns.phi_categories_in_audits`. Data is filtered to the caller’s role.

### GET /api/reports/export (protected)

Same permission rule. Response: PDF (`Content-Type: application/pdf`). Install `barryvdh/laravel-dompdf` via Composer in `laravel-backend`.

---

## Roles and permissions

| Permission | Endpoints |
|------------|-----------|
| chat | POST /api/chat |
| detect | POST /api/detect |
| view_own_conversations | GET /api/conversations |
| policies | GET /api/policies, PUT /api/policies/{id} |
| audit | GET /api/audit-events |
| users | GET /api/users, PUT /api/users/{id} |
| organizations | GET /api/organizations, PUT /api/organizations/{id} |
| (any of) view_own_conversations, audit, organizations | GET /api/reports/summary, GET /api/reports/export |

Roles: **clinician** (chat, detect, view_own_conversations), **security_admin** (+ view_own_conversations, policies, audit, emergency_bypass), **system_admin** (+ view_own_conversations, users, organizations). Missing permission returns 403.

---

## Error format

Validation/server errors return JSON, e.g.:

```json
{ "message": "The given data was invalid.", "errors": { "field": ["..."] } }
```

HTTP status: 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity, 500 Internal Server Error.
