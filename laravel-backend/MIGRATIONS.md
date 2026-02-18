# Migrations (no --force)

Migrations are intended to be run **without** `--force`. Run them only when the app environment and database are correctly set.

## Prerequisites

- MySQL running; database `clinguard` created (or name in `.env`).
- `.env` configured: `DB_CONNECTION=mysql`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.
- `APP_KEY` set (`php artisan key:generate`).

## Run

```bash
cd laravel-backend
php artisan migrate
```

Confirm when prompted. To run non-interactively (e.g. CI):

```bash
php artisan migrate --no-interaction
```

## Rollback

```bash
php artisan migrate:rollback
```

## What was fixed for clean migrations

- **0001_01_01_000000**: `down()` drops `sessions` and `password_reset_tokens` before `users` (dependency order).
- **2026_02_15_100000**: `down()` drops foreign keys from `users` first, then `roles`, then `organizations`.
- **2026_02_15_100001**: `down()` drops tables in reverse dependency order (conversations, audit_events, detection_rules, allowlists, policies).

Schema matches `docs/Diagrams/LOGICAL_SCHEMA.md` and the ERD.
