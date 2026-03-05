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

Response (200): `{ "id", "name", "email", "email_verified_at", "created_at", "updated_at", "role_id", "organization_id" }`.

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
{ "prompt": "User's clinical prompt or question..." }
```

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

## Error format

Validation/server errors return JSON, e.g.:

```json
{ "message": "The given data was invalid.", "errors": { "field": ["..."] } }
```

HTTP status: 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity, 500 Internal Server Error.
