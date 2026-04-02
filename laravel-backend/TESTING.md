# ClinGuard Backend Testing

## Running the full test suite

From the `laravel-backend` directory:

```bash
php artisan test
```

Or run a specific test file:

```bash
php artisan test tests/Feature/Api/DetectionAndChatTest.php
php artisan test tests/Feature/Auth/AuthenticationTest.php
```

Tests use an in-memory SQLite database (configured in `phpunit.xml`). No `.env` changes are required for testing.

## Test coverage summary

| Area | Tests | Description |
|------|--------|-------------|
| **Auth** | AuthenticationTest, RegistrationTest | Login (JSON token + user), logout (/api/logout), register with role/org; invalid password leaves user unauthenticated |
| **API – PHI & Chat** | DetectionAndChatTest | /api/detect returns spans (mocked); /api/chat returns redacted_prompt and response; bypass allowed (config) → 200 + audit chat_bypass; bypass disallowed → 403 |
| **API – Roles & Permissions** | PolicyAndRolesTest | Policies: 200 for security_admin, 403 for clinician. Conversations: 200 for clinician. Audit: 403 for clinician, 200 for security_admin. Users: 403 for security_admin, 200 for system_admin. Organizations: 403 for clinician, 200 for system_admin. Policy update: 200 for security_admin + audit event |
| **API – User profile** | UserProfileTest | GET /api/user returns user with role (id, role_name, permissions); requires auth |
| **API – Reports** | ReportApiTest | GET /api/reports/summary returns role-scoped JSON (personal / organization / global). GET /api/reports/export returns PDF when `barryvdh/laravel-dompdf` is installed (`composer update`). Users without reporting permissions get 403 |
| **Auth (Laravel default)** | PasswordResetTest, EmailVerificationTest | Forgot password and email verification flows if used |

## E2E verification (manual)

1. **Backend:** Run `php artisan migrate --seed` and `php artisan serve`. Seed creates users: clinician@test.com, security@test.com, admin@test.com (password: `password`).
2. **Detection engine:** From `detection_engine/`, run `uvicorn main:app --host 127.0.0.1 --port 8001` (with venv active and optional `phi_model/`).
3. **Frontend:** From project root, run `npm run dev`. Open http://localhost:5173, log in as each role, and verify:
   - **Clinician:** Chat, Conversations, Reports tabs; no Policies, Audit, Users, Organizations.
   - **Security admin:** Chat, Conversations, Policies, Audit, Reports; no Users, Organizations.
   - **System admin:** All tabs including Users, Organizations, Reports (analytics, charts, Export PDF).
4. **PHI flow:** Send a prompt containing PHI (e.g. name, SSN); confirm redacted prompt and spans in the UI. With bypass permission (or config), enable bypass and confirm original prompt is sent and audit shows `chat_bypass`.

## Requirements for 100% pass

- PHP 8.2+ with extensions: pdo_sqlite, json, mbstring, openssl, tokenizer, xml, ctype.
- Composer dependencies installed (`composer install` or `composer update` after pulling changes so `barryvdh/laravel-dompdf` is present for PDF export tests).
- All feature tests must pass with `php artisan test`.
