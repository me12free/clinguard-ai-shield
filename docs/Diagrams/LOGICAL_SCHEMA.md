# ClinGuard – Logical Database Schema (Chapter 4 Design)

Below are the logical tables as implemented by Laravel migrations. They align with the ERD and class diagram.

---

## users

| Column             | Type         | Nullable | Key | Default | Description        |
|--------------------|--------------|----------|-----|---------|--------------------|
| id                 | BIGINT       | No       | PK  | —       | Primary key        |
| role_id            | BIGINT       | Yes      | FK  | NULL    | → roles.id         |
| organization_id    | BIGINT       | Yes      | FK  | NULL    | → organizations.id |
| name               | VARCHAR(255) | No       |     | —       | Full name          |
| email              | VARCHAR(255) | No       | UK  | —       | Unique email       |
| email_verified_at  | TIMESTAMP    | Yes      |     | NULL    | Verification time  |
| password           | VARCHAR(255) | No       |     | —       | Hashed password    |
| remember_token     | VARCHAR(100) | Yes      |     | NULL    | Session token      |
| created_at         | TIMESTAMP    | Yes      |     | NULL    |                    |
| updated_at         | TIMESTAMP    | Yes      |     | NULL    |                    |

---

## organizations

| Column               | Type         | Nullable | Key | Default   | Description |
|----------------------|--------------|----------|-----|-----------|-------------|
| id                   | BIGINT       | No       | PK  | —         | Primary key |
| name                 | VARCHAR(255) | No       |     | —         | Org name    |
| registration_number  | VARCHAR(255) | Yes      |     | NULL      |             |
| subscription_tier    | VARCHAR(255) | No       |     | 'standard'|             |
| configuration        | JSON         | Yes      |     | NULL      |             |
| created_at           | TIMESTAMP    | Yes      |     | NULL      |             |
| updated_at           | TIMESTAMP    | Yes      |     | NULL      |             |

---

## roles

| Column       | Type         | Nullable | Key | Default | Description |
|--------------|--------------|----------|-----|---------|-------------|
| id           | BIGINT       | No       | PK  | —       | Primary key |
| role_name    | VARCHAR(255) | No       |     | —       | e.g. clinician, security_admin |
| permissions  | JSON         | Yes      |     | NULL    |             |
| created_at   | TIMESTAMP    | Yes      |     | NULL    |             |
| updated_at   | TIMESTAMP    | Yes      |     | NULL    |             |

---

## policies

| Column               | Type           | Nullable | Key | Default  | Description        |
|----------------------|----------------|----------|-----|----------|--------------------|
| id                   | BIGINT         | No       | PK  | —        | Primary key        |
| organization_id      | BIGINT         | No       | FK  | —        | → organizations.id |
| policy_name          | VARCHAR(255)   | No       |     | —        |                    |
| phi_categories       | JSON           | Yes      |     | NULL     | PHI types to enforce |
| enforcement_action   | VARCHAR(255)   | No       |     | 'redact' |                    |
| confidence_threshold | DECIMAL(5,4)   | No       |     | 0.85     |                    |
| created_at           | TIMESTAMP      | Yes      |     | NULL     |                    |
| updated_at           | TIMESTAMP      | Yes      |     | NULL     |                    |

---

## allowlists

| Column          | Type         | Nullable | Key | Default | Description        |
|-----------------|--------------|----------|-----|---------|--------------------|
| id              | BIGINT       | No       | PK  | —       | Primary key        |
| organization_id | BIGINT       | No       | FK  | —       | → organizations.id |
| service_name    | VARCHAR(255) | No       |     | —       |                    |
| service_domain  | VARCHAR(255) | Yes      |     | NULL    |                    |
| approval_date   | TIMESTAMP    | Yes      |     | NULL    |                    |
| created_at      | TIMESTAMP    | Yes      |     | NULL    |                    |
| updated_at      | TIMESTAMP    | Yes      |     | NULL    |                    |

---

## detection_rules

| Column          | Type         | Nullable | Key | Default | Description        |
|-----------------|--------------|----------|-----|---------|--------------------|
| id              | BIGINT       | No       | PK  | —       | Primary key        |
| organization_id | BIGINT       | Yes      | FK  | NULL    | → organizations.id |
| rule_type       | VARCHAR(255) | No       |     | —       | regex, entropy, ml |
| rule_pattern    | TEXT         | Yes      |     | NULL    | Pattern or config  |
| phi_category    | VARCHAR(255) | No       |     | —       | SSN, MRN, etc.     |
| created_at      | TIMESTAMP    | Yes      |     | NULL    |                    |
| updated_at      | TIMESTAMP    | Yes      |     | NULL    |                    |

---

## audit_events

| Column               | Type         | Nullable | Key | Default | Description        |
|----------------------|--------------|----------|-----|---------|--------------------|
| id                   | BIGINT       | No       | PK  | —       | Primary key        |
| user_id              | BIGINT       | Yes      | FK  | NULL    | → users.id         |
| organization_id      | BIGINT       | Yes      | FK  | NULL    | → organizations.id |
| event_type           | VARCHAR(255) | No       |     | —       | e.g. chat, login   |
| detected_categories  | JSON         | Yes      |     | NULL    | PHI categories     |
| encrypted_details    | BLOB         | Yes      |     | NULL    | Optional payload   |
| created_at           | TIMESTAMP    | Yes      |     | NULL    |                    |
| updated_at           | TIMESTAMP    | Yes      |     | NULL    |                    |

---

## conversations

| Column           | Type      | Nullable | Key | Default | Description        |
|------------------|-----------|----------|-----|---------|--------------------|
| id               | BIGINT    | No       | PK  | —       | Primary key        |
| user_id          | BIGINT    | No       | FK  | —       | → users.id         |
| prompt_redacted  | TEXT      | Yes      |     | NULL    | Redacted prompt    |
| response_summary | TEXT      | Yes      |     | NULL    | Truncated response |
| created_at       | TIMESTAMP | Yes      |     | NULL    |                    |
| updated_at       | TIMESTAMP | Yes      |     | NULL    |                    |

---

## Laravel system tables (from default migrations)

- **password_reset_tokens** – email (PK), token, created_at  
- **sessions** – id (PK), user_id, ip_address, user_agent, payload, last_activity  
- **cache** – key (PK), value, expiration  
- **cache_locks** – key (PK), owner, expiration  
- **jobs** – queue workflow  
- **personal_access_tokens** – Sanctum API tokens  

---

*Schema matches `laravel-backend/database/migrations/` and the ERD in this folder.*
