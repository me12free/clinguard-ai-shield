# Run Laravel (API), Python detection engine, and optionally frontend.
# Usage: .\scripts\run_all.ps1
$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Item .).FullName }

Write-Host "ClinGuard run script (MySQL + Laravel + Detection + Frontend)"
$laravel = Join-Path $root "laravel-backend"
$engine = Join-Path $root "detection_engine"
$front = $root

# 1) Detection engine (Python venv)
$venv = Join-Path $engine "venv"
if (-not (Test-Path (Join-Path $venv "Scripts\activate.ps1"))) {
    Write-Host "Creating venv in detection_engine..."
    Set-Location $engine
    python -m venv venv
    & (Join-Path $venv "Scripts\Activate.ps1")
    pip install -r requirements.txt
    Set-Location $root
}
Write-Host "Start detection engine: cd detection_engine && venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8001"
Write-Host "Start Laravel: cd laravel-backend && php artisan serve --port 8000"
Write-Host "Start frontend: npm run dev"
Write-Host "Ensure MySQL has DB 'clinguard' and .env is set; run: php artisan migrate"
