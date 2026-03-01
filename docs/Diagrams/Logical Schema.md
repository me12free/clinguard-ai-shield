# ClinGuard – Logical Database Schema (Chapter 4 Design)

Logical schema for the ClinGuard database. Matches **`laravel-backend/database/migrations/`** and is suitable for **MySQL**. Every column has **data type**, **size/precision**, **nullable**, **key**, and **default** where applicable.

---

## Overview

| Table             | Purpose                              | Primary key   | Foreign keys        |
|-------------------|--------------------------------------|---------------|---------------------|
| users             | System users (clinicians, admins)    | user_id       | role_id, organization_id |
| organizations     | Tenants / healthcare orgs            | organization_id | —                 |
| roles             | Role definitions (e.g. clinician)    | role_id       | —                   |
| policies          | PHI policy per organization          | policy_id     | organization_id    |
| allowlists        | Allowed external services            | allowlist_id  | organization_id    |
| detection_rules   | PHI detection rules per org          | detection_rule_id | organization_id |
| audit_events      | Audit log (chat, login, etc.)        | audit_event_id | user_id, organization_id |
| conversations     | Stored chat (redacted prompt, summary)| conversation_id | user_id           |

**Legend:** PK = Primary key, FK = Foreign key, UK = Unique key, AI = Auto-increment. In the database the PK column is `id`; the names above (user_id, organization_id, …) identify which table’s id. Column names match `laravel-backend/database/migrations/`.

---

## 1. Core: users

| Column             | Data Type        | Size/Precision | Nullable | Key | Default | Description                    |
|--------------------|------------------|----------------|----------|-----|---------|--------------------------------|
| id                 | BIGINT UNSIGNED  | 20             | No       | PK  | AI      | Primary key (user_id) |
| role_id            | BIGINT UNSIGNED  | 20             | Yes      | FK  | NULL    | → roles.id         |
| organization_id    | BIGINT UNSIGNED  | 20             | Yes      | FK  | NULL    | → organizations.id |
| name               | VARCHAR          | 255            | No       |     | —       | Full name          |
| email              | VARCHAR          | 255            | No       | UK  | —       | Unique email       |
| email_verified_at  | TIMESTAMP        | —              | Yes      |     | NULL    | Verification time   |
| password           | VARCHAR          | 255            | No       |     | —       | Hashed password    |
| remember_token     | VARCHAR          | 100            | Yes      |     | NULL    | Session token      |
| created_at         | TIMESTAMP        | —              | Yes      |     | NULL    |                    |
| updated_at         | TIMESTAMP        | —              | Yes      |     | NULL    |                    |

---

## 2. Core: organizations

| Column               | Data Type       | Size/Precision | Nullable | Key | Default   | Description                          |
|----------------------|-----------------|----------------|----------|-----|-----------|--------------------------------------|
| id                   | BIGINT UNSIGNED | 20             | No       | PK  | AI        | Primary key (organization_id) |
| name                 | VARCHAR         | 255            | No       |     | —         | Org name    |
| registration_number  | VARCHAR         | 255            | Yes      |     | NULL      |             |
| subscription_tier    | VARCHAR         | 255            | No       |     | 'standard'|             |
| configuration        | JSON            | —              | Yes      |     | NULL      |             |
| created_at           | TIMESTAMP       | —              | Yes      |     | NULL      |             |
| updated_at           | TIMESTAMP       | —              | Yes      |     | NULL      |             |

---

## 3. Core: roles

| Column       | Data Type       | Size/Precision | Nullable | Key | Default | Description                    |
|--------------|-----------------|----------------|----------|-----|---------|--------------------------------|
| id           | BIGINT UNSIGNED | 20             | No       | PK  | AI      | Primary key (role_id) |
| role_name    | VARCHAR         | 255            | No       |     | —       | e.g. clinician, security_admin |
| permissions  | JSON            | —              | Yes      |     | NULL    |                                |
| created_at   | TIMESTAMP       | —              | Yes      |     | NULL    |                                |
| updated_at   | TIMESTAMP       | —              | Yes      |     | NULL    |                                |

---

## 4. Policy & config: policies

| Column               | Data Type       | Size/Precision | Nullable | Key | Default | Description                          |
|----------------------|-----------------|----------------|----------|-----|---------|--------------------------------------|
| id                   | BIGINT UNSIGNED | 20             | No       | PK  | AI      | Primary key (policy_id) |
| organization_id      | BIGINT UNSIGNED | 20             | No       | FK  | —       | → organizations.id   |
| policy_name          | VARCHAR         | 255            | No       |     | —       |                      |
| phi_categories       | JSON            | —              | Yes      |     | NULL    | PHI types to enforce |
| enforcement_action   | VARCHAR         | 255            | No       |     | 'redact'|                      |
| confidence_threshold | DECIMAL         | 5,4            | No       |     | 0.85    |                      |
| created_at           | TIMESTAMP       | —              | Yes      |     | NULL    |                      |
| updated_at           | TIMESTAMP       | —              | Yes      |     | NULL    |                      |

---

## 5. Policy & config: allowlists

| Column          | Data Type       | Size/Precision | Nullable | Key | Default | Description                             |
|-----------------|-----------------|----------------|----------|-----|---------|-----------------------------------------|
| id              | BIGINT UNSIGNED | 20             | No       | PK  | AI      | Primary key (allowlist_id) |
| organization_id | BIGINT UNSIGNED | 20             | No       | FK  | —       | → organizations.id |
| service_name    | VARCHAR         | 255            | No       |     | —       |                    |
| service_domain  | VARCHAR         | 255            | Yes      |     | NULL    |                    |
| approval_date   | TIMESTAMP       | —              | Yes      |     | NULL    |                    |
| created_at      | TIMESTAMP       | —              | Yes      |     | NULL    |                    |
| updated_at      | TIMESTAMP       | —              | Yes      |     | NULL    |                    |

---

## 6. Policy & config: detection_rules

| Column          | Data Type       | Size/Precision | Nullable | Key | Default | Description                                |
|-----------------|-----------------|----------------|----------|-----|---------|--------------------------------------------|
| id              | BIGINT UNSIGNED | 20             | No       | PK  | AI      | Primary key (detection_rule_id) |
| organization_id | BIGINT UNSIGNED | 20             | Yes      | FK  | NULL    | → organizations.id  |
| rule_type       | VARCHAR         | 255            | No       |     | —       | regex, entropy, ml  |
| rule_pattern    | TEXT            | 65535         | Yes      |     | NULL    | Pattern or config   |
| phi_category    | VARCHAR         | 255            | No       |     | —       | SSN, MRN, etc.      |
| created_at      | TIMESTAMP       | —              | Yes      |     | NULL    |                     |
| updated_at      | TIMESTAMP       | —              | Yes      |     | NULL    |                     |

---

## 7. Audit & usage: audit_events

| Column               | Data Type       | Size/Precision | Nullable | Key | Default | Description                             |
|----------------------|-----------------|----------------|----------|-----|---------|-----------------------------------------|
| id                   | BIGINT UNSIGNED | 20             | No       | PK  | AI      | Primary key (audit_event_id) |
| user_id              | BIGINT UNSIGNED | 20             | Yes      | FK  | NULL    | → users.id         |
| organization_id      | BIGINT UNSIGNED | 20             | Yes      | FK  | NULL    | → organizations.id |
| event_type           | VARCHAR         | 255            | No       |     | —       | e.g. chat, login   |
| detected_categories  | JSON            | —              | Yes      |     | NULL    | PHI categories     |
| encrypted_details    | BLOB            | —              | Yes      |     | NULL    | Optional payload    |
| created_at           | TIMESTAMP       | —              | Yes      |     | NULL    |                    |
| updated_at           | TIMESTAMP       | —              | Yes      |     | NULL    |                    |

---

## 8. Audit & usage: conversations

| Column           | Data Type       | Size/Precision | Nullable | Key | Default | Description                             |
|------------------|-----------------|----------------|----------|-----|---------|-----------------------------------------|
| id               | BIGINT UNSIGNED | 20             | No       | PK  | AI      | Primary key (conversation_id) |
| user_id          | BIGINT UNSIGNED | 20             | No       | FK  | —       | → users.id         |
| prompt_redacted  | TEXT            | 65535         | Yes      |     | NULL    | Redacted prompt    |
| response_summary | TEXT            | 65535         | Yes      |     | NULL    | Truncated response |
| created_at       | TIMESTAMP       | —              | Yes      |     | NULL    |                    |
| updated_at       | TIMESTAMP       | —              | Yes      |     | NULL    |                    |

---

## Data type notes

| Type             | Size/Precision | Meaning / MySQL equivalent        |
|------------------|----------------|-----------------------------------|
| BIGINT UNSIGNED  | 20             | Auto-increment IDs                |
| VARCHAR          | 255, 100       | Variable-length string (max chars)|
| TIMESTAMP        | —              | Date and time                     |
| DECIMAL          | 5,4            | 5 total digits, 4 after decimal    |
| TEXT             | 65535          | Max length in bytes (MySQL)       |
| JSON             | —              | JSON column                       |
| BLOB             | —              | Binary payload                    |

---

## Laravel system tables (default migrations)

- **password_reset_tokens** — email VARCHAR(255) PK, token VARCHAR(255), created_at TIMESTAMP  
- **sessions** — id VARCHAR(255) PK, user_id BIGINT UNSIGNED, ip_address VARCHAR(45), user_agent TEXT, payload LONGTEXT, last_activity INT  
- **cache**, **cache_locks**, **jobs**, **personal_access_tokens** — as per Laravel defaults  

---

*This schema aligns with the **ERD Diagram.mmd** and **Class Diagram.mmd** in this folder.*
