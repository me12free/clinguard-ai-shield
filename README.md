
# ClinGuard

A web application to prevent Protected Health Information (PHI) in AI service prompts using RAG and OpenAI.

## Project Overview

ClinGuard is a secure web application designed to help healthcare professionals safely utilize AI for clinical documentation while ensuring compliance with data protection regulations such as HIPAA and Kenya's Data Protection Act 2019. The system detects and redacts PHI before it reaches external AI services.

## Features

- Real-time PHI detection and redaction
- Integration with OpenAI's API
- Retrieval-Augmented Generation (RAG) for clinical knowledge
- Secure user authentication and role-based access control
- Comprehensive audit logging
- Responsive web interface

## Monorepo Structure

This repository contains both the React frontend and Laravel backend:

- `src/` — React (Vite + Tailwind) frontend
- `laravel-backend/` — Laravel 12.x backend API
- `docs/` — Documentation (research, architecture, deployment)


## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Laravel 12.x, PHP 8.2+
- **Database**: MySQL 8.x only (no Supabase); all data and auth via Laravel API.
- **Detection + RAG**: Python 3.10+, venv (no Composer); FastAPI, regex + entropy + optional NER, ChromaDB, sentence-transformers
- **AI**: OpenAI API (GPT-4 / gpt-4o-mini)

## Quick Setup and Startup Guide

### Prerequisites

- Node.js 18+, npm 9+
- Python 3.10+ (detection engine)
- PHP 8.2+, Composer (Laravel backend)
- MySQL 8.x

### 1) Clone and create database

```bash
git clone https://github.com/yourusername/clinguard-ai-shield.git
cd clinguard-ai-shield
# In MySQL:
# CREATE DATABASE clinguard;
```

### 2) Backend setup (Laravel API)

```bash
cd laravel-backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
```

Update `laravel-backend/.env` at least:

- `DB_DATABASE=clinguard`
- `DB_USERNAME=...`
- `DB_PASSWORD=...`
- `DETECTION_ENGINE_URL=http://127.0.0.1:8001`
- `OPENAI_API_KEY=...` (optional, but needed for real chat responses)
- `FRONTEND_URL=http://localhost:8080`

Start backend:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### 3) Detection engine setup (FastAPI PHI + RAG)

In a new terminal:

```bash
cd detection_engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001
```

Windows activate command:

```bash
venv\Scripts\activate
```

Optional checks:

```bash
curl http://127.0.0.1:8001/health
```

### 4) Frontend setup (Vite React)

In a third terminal:

```bash
cd /path/to/clinguard-ai-shield
cp .env.example .env
npm install
npm run dev
```

For local dev, keep root `.env` defaults:

- `VITE_API_URL=` (empty, so Vite proxy is used)
- `VITE_PROXY_TARGET=http://127.0.0.1:8000`

Open:

- Frontend: `http://localhost:8080`
- Laravel API: `http://127.0.0.1:8000`
- Detection engine: `http://127.0.0.1:8001`

### Startup order (recommended)

1. Start Laravel backend (`php artisan serve`)
2. Start detection engine (`uvicorn main:app ...`)
3. Start frontend (`npm run dev`)

### Seeded test users

Password for all: `password`

- `sarah.chen@clinguard.local` (clinician)
- `marcus.webb@clinguard.local` (security admin)
- `priya.nair@clinguard.local` (system admin)

### Quick sanity test

1. Sign in from `http://localhost:8080`
2. Open Dashboard > Clinical AI
3. Send a prompt with demo PHI
4. Verify:
   - redacted outbound prompt appears
   - detected spans appear
   - RAG context appears (if engine dependencies are installed)

### API security

- Auth: Laravel Sanctum (**Bearer token** for `/api/*`). Login/register at `/login`, `/register` (web). SPA does not use Sanctum cookie CSRF on `/api/*`.
- Protected endpoints: `/api/detect`, `/api/chat`, `/api/user`, `/api/logout` require `Authorization: Bearer <token>`.
- Rate limit: 60 requests/minute on API routes. Input validation via FormRequests.

## Diagrams (Chapter 4)

See `docs/diagrams/`: Use Case, Sequence, ERD, Class, Context, DFD Level 1, Activity (Mermaid sources for StarUML/Visual Paradigm).

## Project Structure

```
├── src/                  # React frontend
├── laravel-backend/      # Laravel API (MySQL)
├── detection_engine/     # Python PHI detection + RAG (venv)
├── docs/                 # Documentation + diagrams
├── scripts/              # run_detection.bat, run_all.ps1
└── .env.example          # VITE_API_URL for frontend
```

## Development

See [SECURITY.md](SECURITY.md) for security best practices and reporting guidelines.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Strathmore University
- OpenAI
- Laravel Community
- React Community
