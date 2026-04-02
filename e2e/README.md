# ClinGuard E2E Tests (Playwright)

End-to-end tests for the frontend and role-based API access.

## Prerequisites

1. **Backend running**  
   From `laravel-backend`:
   ```bash
   php artisan serve
   ```
   Default: `http://127.0.0.1:8000`. Database must be migrated and seeded (e.g. `php artisan migrate --seed`).

2. **Playwright browsers (first time only)**  
   From project root:
   ```bash
   npx playwright install chromium
   ```

3. **Frontend API URL**  
   The app uses `VITE_API_URL` at build time. For `npm run dev` (and the E2E webServer), set in `.env`:
   ```
   VITE_API_URL=http://127.0.0.1:8000
   ```
   For API-by-role tests, set the same URL when running Playwright:
   ```bash
   set VITE_API_URL=http://127.0.0.1:8000
   npx playwright test
   ```
   (On Unix: `VITE_API_URL=http://127.0.0.1:8000 npx playwright test`)

## What is tested

- **Auth** – Redirect when unauthenticated, login, invalid credentials, logout.
- **Role dashboard** – Clinician sees Chat + Conversations + Reports; Security Admin sees + Policies, Audit; System Admin sees all tabs (Users, Organizations, Reports). Each role can open Chat.
- **API by role** – After login, requests to `/api/conversations`, `/api/policies`, `/api/audit-events`, `/api/users`, `/api/organizations`, `/api/reports/summary` return 200 or 403 according to role. `/api/user` returns 200 for all roles. PDF export is checked separately (200 when DomPDF is installed on the API).
- **Reports UI** – `reports-dashboard.spec.ts` opens the Reports tab and checks analytics scope text and optional PDF download.

## Run E2E

From project root:

```bash
# Start backend first (in another terminal)
cd laravel-backend && php artisan serve

# Run E2E (starts frontend via Playwright webServer if not already running)
npm run test:e2e
```

Or with UI:

```bash
npm run test:e2e:ui
```

## Seeded test users

| Email              | Password | Role          |
|--------------------|----------|---------------|
| clinician@test.com | password | clinician     |
| security@test.com  | password | security_admin|
| admin@test.com     | password | system_admin  |

Ensure `DatabaseSeeder` has been run so these users exist.
