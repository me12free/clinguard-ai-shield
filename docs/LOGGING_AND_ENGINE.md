# Logging and detection engine (ML vs regex)

## Where logs go

| Process | Location / how to view |
|--------|-------------------------|
| **Laravel** | `laravel-backend/storage/logs/laravel.log` — chat, detection, RAG, OpenAI warnings/errors, conversation save failures |
| **Detection engine (Python)** | Stdout when running `uvicorn` — each `/detect`, `/rag`, `/health` request is logged |
| **Vite / browser** | DevTools → Network / Console for `/api/*` |

Set `LOG_LEVEL=debug` in `laravel-backend/.env` for more detail (if `config/logging.php` supports it).

---

## Is the **model** used or only **regex/heuristics**?

The Python app (`detection_engine/phi_detector.py`) can run:

1. **Regex + patient-line + entropy** — “manual” rules.
2. **NER (ML)** — only when `USE_ML=1` and the pipeline includes NER. Then:
   - If `phi_model/` (or `PHI_MODEL_PATH`) contains a trained `config.json`, **your local model** is loaded.
   - Else it **may** fall back to **`dslim/bert-base-NER`** from Hugging Face (first call downloads the model).

### `PHI_DETECTION_MODE` — test **regex only**, **model only**, or **both**

| Mode | Env | What runs |
|------|-----|-----------|
| **Both** (default) | `PHI_DETECTION_MODE=both` | Rules + NER (if `USE_ML=1`). |
| **Manual / regex only** | `PHI_DETECTION_MODE=regex_only` | Rules only — **no** transformer NER. |
| **Model / NER only** | `PHI_DETECTION_MODE=ner_only` + `USE_ML=1` | **Only** NER — no regex/patient-line/entropy. |

If `ner_only` + `USE_ML=0`, **no spans** are returned (`detection_pipeline` = `ner_only_disabled` in `/health`).

### Check without reading code

```bash
curl -s http://127.0.0.1:8001/health | jq .
```

Response includes:

- `phi_detection_mode` — `both` | `regex_only` | `ner_only`.
- `detection_pipeline` — `full` | `regex_only` | `ner_only` | `ner_only_disabled`.
- `use_ml` — `false` → **no NER** in `both` mode.
- `phi_model_has_config` — `true` → local **`phi_model`** is present.
- `ner_mode` — which NER backend would load: `regex_only` (USE_ML off) | `local_phi_model` | `dslim_fallback`.

### Example: switch modes (restart uvicorn after changing env)

From `detection_engine/`:

```bash
# 1) Rules only (no NER)
PHI_DETECTION_MODE=regex_only python -m uvicorn main:app --host 127.0.0.1 --port 8001

# 2) NER only (your phi_model or dslim — same as /health ner_mode)
PHI_DETECTION_MODE=ner_only USE_ML=1 python -m uvicorn main:app --host 127.0.0.1 --port 8001

# 3) Default — both rules + NER
PHI_DETECTION_MODE=both USE_ML=1 python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Legacy alias: `USE_ML=0` with `PHI_DETECTION_MODE=both` disables NER (same effect as `regex_only` for the combined pipeline).

### Force regex-only (compare behavior)

```bash
PHI_DETECTION_MODE=regex_only python -m uvicorn main:app --host 0.0.0.0 --port 8001
# or: USE_ML=0 with PHI_DETECTION_MODE=both
```

Restart Laravel’s detection URL target if the port changes.

### OpenAI “model” vs engine

- **PHI detection** = always your **Python engine** (Laravel calls it before OpenAI).
- **Chat text generation** = **OpenAI** only if `OPENAI_API_KEY` is set; otherwise Laravel returns a fixed placeholder string (not a model).

---

## Structured log fields (Laravel)

Look for these **channels** in `laravel.log`:

- `clinguard.chat` — user id, span count, OpenAI configured, conversation id (if saved).
- `clinguard.detection` — text length, span count, engine URL host (not full PHI).
- `clinguard.openai` — model id, success/failure.
- Errors on **conversation insert** include exception message (no raw prompt in logs by default).
