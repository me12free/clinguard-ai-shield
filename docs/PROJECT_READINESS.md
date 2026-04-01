# Project readiness checklist

Use this to see what must be running for ClinGuard to be **fully functional** end-to-end.

## Seeded dev accounts (after `php artisan db:seed`)

| Display name   | Email                       | Role            | Password   |
|----------------|-----------------------------|-----------------|------------|
| Dr. Sarah Chen | sarah.chen@clinguard.local  | clinician       | `password` |
| Marcus Webb    | marcus.webb@clinguard.local | security_admin  | `password` |
| Priya Nair     | priya.nair@clinguard.local  | system_admin    | `password` |

Login and `/api/user` return `user.role.role_name` and `permissions` (see `AuthenticatedSessionController`).

## Dashboard (same URL, role-aware UI)

`/dashboard` is one route with a **sidebar** (mobile: slide-out menu). Navigation is driven by `src/lib/dashboardNav.ts` — **only sections the role may use** appear:

| Role | Sidebar |
|------|---------|
| **clinician** | **Clinical AI** (new chat + history), **PHI scan** — defaults to Clinical AI |
| **security_admin** | **Overview**, Clinical AI, PHI scan, **Policies**, **Audit log** — defaults to Overview |
| **system_admin** | Same as security admin + **Platform** |

All flows still call the same APIs (`/api/chat`, `/api/detect`, `/api/conversations`, etc.).

## Automated tests (Laravel)

```bash
cd laravel-backend && php artisan test
```

- **`RoleBasedAuthE2ETest`** — login + token + `/api/user` for each role.
- **`PhiEngineDetectionE2ETest`** — `/api/detect` with the Python engine **HTTP-faked** (no real `uvicorn` required in CI).

## Manual PHI / chat prompts & engine notes

- **`docs/MANUAL_TEST_PROMPTS.md`** — copy-paste prompts for Clinical AI, PHI scan, edge cases.
- **`docs/LOGGING_AND_ENGINE.md`** — where logs live, `GET /health` on the Python app (`ner_mode`: regex vs ML), OpenAI vs engine.
- **`docs/CLINICAL_AI_PIPELINE.md`** — what RAG does vs OpenAI, redaction order, why span counts can spike with NER.

### Chat history in the DB

- **`POST /api/chat`** saves to **`conversations`** (`prompt_redacted`, `response_summary`). If inserts fail, check **`storage/logs/clinguard.log`** for `chat.conversation_save_failed` (migrations, DB connection, permissions).
- **`GET /api/conversations`** — list your saved rows (authenticated, `chat` permission). The dashboard may not show a history panel yet; use this API or `sqlite3`/`mysql` to verify persistence.

## What must be running locally (full stack)

| Component | Port / config | Required for |
|-----------|----------------|--------------|
| MySQL | `.env` `DB_*` | Laravel API, auth, audit |
| Laravel `php artisan serve` | `8000` (or `VITE_API_URL`) | Frontend API, auth, proxy to engine |
| Detection engine `uvicorn main:app` | `8001` | Real PHI spans on `/api/detect` |
| `DETECTION_ENGINE_URL` in Laravel `.env` | e.g. `http://127.0.0.1:8001` | Laravel → Python |
| `phi_model/` under `detection_engine/` | — | Trained NER (optional; regex fallback exists) |
| `OPENAI_API_KEY` | — | Chat completions (`/api/chat`); without it, users see the “key not configured” message |
| RAG / Chroma (optional) | — | `/api/rag` context; chat works with empty RAG if engine returns `[]` |

## Pending / gaps for “production-ready”

1. **Authorization by role** — API routes today are mostly `auth:sanctum` only; `permissions` in DB are **not** enforced on `PolicyController`, `/api/chat`, etc. Add middleware or gates (e.g. `can:manage-policies`).
2. **Browser E2E** — Laravel feature tests cover HTTP API; add Playwright/Cypress if you need full UI E2E.
3. **Real PHI engine in CI** — Tests mock HTTP; production validation needs `uvicorn` + `phi_model` + `DETECTION_ENGINE_URL`.
4. **Email / queues** — Password reset and verification are not customized for your domain; configure `MAIL_*` for production.
5. **Secrets** — Never commit `.env`; rotate `APP_KEY`, DB passwords, and API keys per environment.

## CORS, 419, and environment variables

### Recommended local setup (fewest issues)

1. In the **repo root** `.env`, leave **`VITE_API_URL` empty** (see root `.env.example`).
2. **`VITE_PROXY_TARGET`** should match `php artisan serve` (default `http://127.0.0.1:8000`).
3. Open the app at **`http://localhost:8080`** (or `http://127.0.0.1:8080` consistently). The SPA calls ` /api/...` on the same origin; Vite proxies to Laravel — **no CORS**, no cross-host CSRF on API.

### Direct API URL (alternative)

Set **`VITE_API_URL=http://localhost:8000`** (same hostname as you use in the browser). Do **not** mix `localhost` and `127.0.0.1`.

- **`FRONTEND_URL`** in `laravel-backend/.env` must match the Vite page origin (e.g. `http://localhost:8080`).
- `config/cors.php` allows `localhost:8080` / `127.0.0.1:8080` and local port patterns.
- After changing `.env`: `php artisan config:clear`.

### Why 419 happened on `/api/*`

Sanctum’s **`EnsureFrontendRequestsAreStateful`** middleware was applied to API routes for SPA origins; it runs **CSRF** validation. The SPA uses **Bearer tokens** only, not `X-XSRF-TOKEN`, so POSTs like `/api/chat` returned **419**. That middleware is **not** prepended for this app (Bearer-only).

**SPA JSON login:** `login` / `register` web routes are still excluded from CSRF in `bootstrap/app.php` because those use token responses.

**“No token received”:** handled by `App\Http\Middleware\RedirectIfAuthenticated` (JSON login clears stale web sessions).

## Quick smoke (manual)

1. Start MySQL, Laravel, detection engine, `npm run dev`.
2. Log in with one of the seeded accounts above.
3. **Detect:** use Dashboard detect or `POST /api/detect` — spans should appear if the engine is up.
4. **Chat:** requires `OPENAI_API_KEY`; expect redacted prompt + AI reply when configured.
