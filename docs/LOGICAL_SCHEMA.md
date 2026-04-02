# ClinGuard — logical database schema

This document describes the **logical schema** (entities, attributes, keys, and referential integrity) for the ClinGuard Laravel backend. It is derived from the migrations under `laravel-backend/database/migrations/` and matches the implemented relational model.

**Scope:** Application domain tables for organisations, identity, policy, chat logging, and audit. Framework tables (e.g. `sessions`, `cache`, `jobs`, `personal_access_tokens`) are listed briefly at the end for completeness.

---

## 1. Entity–relationship overview

```mermaid
erDiagram
  organizations ||--o{ users : "employs"
  organizations ||--o{ policies : "configures"
  organizations ||--o{ allowlists : "owns"
  organizations ||--o{ detection_rules : "scopes"
  organizations ||--o{ audit_events : "context"
  roles ||--o{ users : "assigned_to"
  users ||--o{ conversations : "creates"
  users ||--o{ audit_events : "performs"

  organizations {
    bigint id PK
    string name
    string registration_number "nullable"
    string subscription_tier
    json configuration "nullable"
    timestamps created_at updated_at
  }

  roles {
    bigint id PK
    string role_name
    json permissions "nullable"
    timestamps created_at updated_at
  }

  users {
    bigint id PK
    string name
    string email UK
    timestamp email_verified_at "nullable"
    string password
    string remember_token "nullable"
    bigint role_id FK "nullable"
    bigint organization_id FK "nullable"
    timestamps created_at updated_at
  }

  policies {
    bigint id PK
    bigint organization_id FK
    string policy_name
    json phi_categories "nullable"
    string enforcement_action
    decimal confidence_threshold
    timestamps created_at updated_at
  }

  allowlists {
    bigint id PK
    bigint organization_id FK
    string service_name
    string service_domain "nullable"
    timestamp approval_date "nullable"
    timestamps created_at updated_at
  }

  detection_rules {
    bigint id PK
    bigint organization_id FK "nullable"
    string rule_type
    text rule_pattern "nullable"
    string phi_category
    timestamps created_at updated_at
  }

  audit_events {
    bigint id PK
    bigint user_id FK "nullable"
    bigint organization_id FK "nullable"
    string event_type
    json detected_categories "nullable"
    binary encrypted_details "nullable"
    timestamps created_at updated_at
  }

  conversations {
    bigint id PK
    bigint user_id FK
    text prompt_redacted "nullable"
    text response_summary "nullable"
    timestamps created_at updated_at
  }
```

---

## 2. Relations (foreign keys)

| Child table        | Foreign key        | Parent table    | ON DELETE (migration) |
|-------------------|--------------------|-----------------|------------------------|
| `users`           | `role_id`          | `roles`         | SET NULL               |
| `users`           | `organization_id`  | `organizations` | SET NULL               |
| `policies`        | `organization_id`  | `organizations` | CASCADE                |
| `allowlists`      | `organization_id`  | `organizations` | CASCADE                |
| `detection_rules` | `organization_id`  | `organizations` | SET NULL               |
| `audit_events`    | `user_id`          | `users`         | SET NULL               |
| `audit_events`    | `organization_id`  | `organizations` | SET NULL               |
| `conversations`   | `user_id`          | `users`         | CASCADE                |

---

## 3. Table definitions (logical)

### 3.1 `organizations`

| Attribute              | Logical type        | Constraints / notes                          |
|------------------------|---------------------|----------------------------------------------|
| `id`                   | integer (surrogate) | PK, auto-increment                           |
| `name`                 | string              | required                                     |
| `registration_number`  | string              | optional                                     |
| `subscription_tier`    | string              | default `standard`                           |
| `configuration`        | JSON                | optional structured settings                 |
| `created_at`, `updated_at` | datetime        | optional (Laravel timestamps)                |

### 3.2 `roles`

| Attribute              | Logical type        | Constraints / notes                          |
|------------------------|---------------------|----------------------------------------------|
| `id`                   | integer (surrogate) | PK                                           |
| `role_name`            | string              | required                                     |
| `permissions`          | JSON                | optional (e.g. permission list)              |
| `created_at`, `updated_at` | datetime        | optional                                     |

### 3.3 `users`

| Attribute              | Logical type        | Constraints / notes                          |
|------------------------|---------------------|----------------------------------------------|
| `id`                   | integer (surrogate) | PK                                           |
| `name`                 | string              | required                                     |
| `email`                | string              | required, unique                             |
| `email_verified_at`    | datetime            | optional                                     |
| `password`             | string              | required (stored hashed)                     |
| `remember_token`       | string              | optional                                     |
| `role_id`              | integer             | FK → `roles.id`, nullable                    |
| `organization_id`      | integer             | FK → `organizations.id`, nullable            |
| `created_at`, `updated_at` | datetime        | optional                                     |

### 3.4 `policies`

| Attribute               | Logical type        | Constraints / notes                         |
|-------------------------|---------------------|---------------------------------------------|
| `id`                    | integer (surrogate) | PK                                          |
| `organization_id`       | integer             | FK → `organizations.id`, required           |
| `policy_name`           | string              | required                                    |
| `phi_categories`        | JSON                | optional                                    |
| `enforcement_action`    | string              | default `redact`                            |
| `confidence_threshold`  | decimal             | precision 5, scale 4; default `0.85`        |
| `created_at`, `updated_at` | datetime         | optional                                    |

### 3.5 `allowlists`

| Attribute              | Logical type        | Constraints / notes                          |
|------------------------|---------------------|----------------------------------------------|
| `id`                   | integer (surrogate) | PK                                           |
| `organization_id`      | integer             | FK → `organizations.id`, required          |
| `service_name`         | string              | required                                     |
| `service_domain`       | string              | optional                                     |
| `approval_date`        | datetime            | optional                                     |
| `created_at`, `updated_at` | datetime        | optional                                     |

### 3.6 `detection_rules`

| Attribute              | Logical type        | Constraints / notes                          |
|------------------------|---------------------|----------------------------------------------|
| `id`                   | integer (surrogate) | PK                                           |
| `organization_id`      | integer             | FK → `organizations.id`, nullable          |
| `rule_type`            | string              | required                                     |
| `rule_pattern`         | text                | optional                                     |
| `phi_category`         | string              | required                                     |
| `created_at`, `updated_at` | datetime        | optional                                     |

### 3.7 `audit_events`

| Attribute              | Logical type        | Constraints / notes                          |
|------------------------|---------------------|----------------------------------------------|
| `id`                   | integer (surrogate) | PK                                           |
| `user_id`              | integer             | FK → `users.id`, nullable                    |
| `organization_id`      | integer             | FK → `organizations.id`, nullable            |
| `event_type`           | string              | required                                     |
| `detected_categories`  | JSON                | optional                                     |
| `encrypted_details`    | binary (BLOB)       | optional                                     |
| `created_at`, `updated_at` | datetime        | optional                                     |

### 3.8 `conversations`

| Attribute              | Logical type        | Constraints / notes                          |
|------------------------|---------------------|----------------------------------------------|
| `id`                   | integer (surrogate) | PK                                           |
| `user_id`              | integer             | FK → `users.id`, required                    |
| `prompt_redacted`      | text                | optional (redacted user prompt)              |
| `response_summary`     | text                | optional                                     |
| `created_at`, `updated_at` | datetime        | optional                                     |

---

## 4. Notes vs. Chen ERD diagram

A separate **Chen-style** teaching diagram may exist as `docs/Diagrams/clinguard_erd_chen_bright.svg`. The **report ERD** for ClinGuard uses `docs/Diagrams/png/Clinguard ERD.png` (Crow’s Foot / tool export). Differences between any conceptual diagram and this **implemented** logical schema include:

- **Organizations:** the diagram uses a generic `domain`; the database uses `registration_number`, `subscription_tier`, and `configuration` (JSON), not a separate `domain` column.
- **Policies:** diagram attributes such as `detection_threshold` / `allow_bypass` / `redaction_rules` map conceptually to `confidence_threshold`, `enforcement_action`, and `phi_categories` in migrations.
- **Conversations:** diagram labels like `redacted_prompt` / `input` align conceptually with `prompt_redacted` and optional raw storage elsewhere; the migration stores `prompt_redacted` and `response_summary` only.
- **Audit events:** the diagram may show `conversation_id`; **there is no `conversation_id` FK** on `audit_events` in current migrations—audit rows link to `user` and `organization` only.

If you add `conversation_id` or rename columns for parity with the ERD, update this document and run a new migration.

---

## 5. Framework / infrastructure tables (reference)

Created by default Laravel migrations (not domain-specific):

- `sessions` — web session store (references `user_id` without FK in base migration).
- `password_reset_tokens` — password reset flow.
- `cache`, `cache_locks` — cache backend.
- `jobs`, `job_batches`, `failed_jobs` — queue.
- `personal_access_tokens` — API tokens (Sanctum).

---

*Generated from ClinGuard Laravel migrations. Regenerate or edit when schema changes.*
