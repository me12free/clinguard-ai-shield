
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
- **Database**: MySQL 8.x (default), SQLite (optional)
- **AI + RAG Services**: Python 3.10+, spaCy, Transformers
- **Vector Database**: ChromaDB
- **AI Integration**: OpenAI API (GPT-4)
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.10+
- PHP 8.2+
- Composer

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/clinguard.git
   cd clinguard
   ```


2. Set up the Laravel backend (MySQL):
   ```bash
   cd laravel-backend
   cp .env.example .env
   # Edit .env to set DB_CONNECTION, DB_DATABASE, DB_USERNAME, DB_PASSWORD for MySQL
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan serve --host=127.0.0.1 --port=8000
   ```

3. In a new terminal, set up the React frontend:
   ```bash
   cd .. # if inside laravel-backend
   npm install
   npm run dev
   ```

4. Visit the React app (usually at http://localhost:5173) and test the backend API connection (see "Backend API Test" section on the homepage).

## Backend API Test

The homepage includes a "Backend API Test" section that fetches a message from the Laravel backend at `/api/hello`. If the backend is running and accessible, you should see a success message. If not, check your backend server and CORS settings.

## Project Structure

```
├── src/                  # React frontend
├── laravel-backend/      # Laravel backend API
├── docs/                 # Documentation (research, architecture, deployment)
└── ...                   # Other project files
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
