@echo off
cd /d "%~dp0..\detection_engine"
if not exist "venv\Scripts\activate.bat" (
  python -m venv venv
  call venv\Scripts\activate.bat
  pip install -r requirements.txt
) else (
  call venv\Scripts\activate.bat
)
uvicorn main:app --host 127.0.0.1 --port 8001
