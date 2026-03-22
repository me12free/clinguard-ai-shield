# ClinGuard detection engine (FastAPI)

## Run (after `pip install -r requirements.txt` in your venv)

Always use the **venv’s Python** so you don’t pick up the system `uvicorn` (`/usr/bin/uvicorn`), which won’t see packages installed in the venv:

```bash
source venv/bin/activate   # Windows: venv\Scripts\activate
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Laravel expects this URL by default: `DETECTION_ENGINE_URL=http://127.0.0.1:8001`

## If you see `ModuleNotFoundError: No module named 'fastapi'`

You’re not using the venv interpreter. Use `python -m uvicorn ...` as above, or call `./venv/bin/uvicorn` directly.

## If you see `No module named uvicorn` **while** the venv is active

This venv never got those packages (e.g. venv was recreated after a big install, or `pip` pointed at another Python). Install only the server stack (quick):

```bash
pip install "uvicorn[standard]==0.32.1" "fastapi==0.115.6"
```

If `main.py` then fails on `torch`, `transformers`, etc., run **`pip install -r requirements.txt`** once in this venv.

Always verify: `which pip` → `.../detection_engine/venv/bin/pip`.
