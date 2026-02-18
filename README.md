
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
- **Database**: MySQL 8.x (default)
- **Detection + RAG**: Python 3.10+, venv (no Composer); FastAPI, regex + entropy + optional NER, ChromaDB, sentence-transformers
- **AI**: OpenAI API (GPT-4 / gpt-4o-mini)

## Getting Started

### Prerequisites

- Node.js 18+, npm 9+
- Python 3.10+ (for detection engine; use venv)
- PHP 8.2+, Composer (for Laravel only)
- MySQL 8.x

### Installation

1. **Clone and create DB**
   ```bash
   git clone https://github.com/yourusername/clinguard-ai-shield.git
   cd clinguard-ai-shield
   # Create database: CREATE DATABASE clinguard;
   ```

2. **Laravel backend (MySQL)**
   ```bash
   cd laravel-backend
   cp .env.example .env
   # Set DB_DATABASE=clinguard, DB_USERNAME, DB_PASSWORD. Optionally DETECTION_ENGINE_URL, OPENAI_API_KEY.
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan serve --host=127.0.0.1 --port=8000
   ```

3. **Python detection engine (separate terminal, use venv)**
   ```bash
   cd detection_engine
   python -m venv venv
   venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 8001
   ```
   Or run `scripts\run_detection.bat` (Windows).

4. **Frontend**
   ```bash
   cd ..   # project root
   cp .env.example .env   # optional: set VITE_API_URL=http://127.0.0.1:8000
   npm install
   npm run dev
   ```
   Open http://localhost:5173. Sign in or register, then use **Dashboard** to send prompts (PHI detected, redacted, RAG + OpenAI).

### API security

- Auth: Laravel Sanctum (Bearer token for `/api/*`). Login/register at `/login`, `/register` (web).
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
