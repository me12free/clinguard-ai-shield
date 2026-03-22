"""
ClinGuard detection + RAG API. Run: uvicorn main:app --host 0.0.0.0 --port 8001
"""
import logging
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from phi_detector import detect, get_detection_settings
from rag_engine import rag_query

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("clinguard.engine")

app = FastAPI(title="ClinGuard Detection & RAG", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DetectBody(BaseModel):
    text: str = Field(..., max_length=50_000)


class RagBody(BaseModel):
    query: str = Field(..., max_length=10_000)
    top_k: int = Field(5, ge=1, le=20)


@app.post("/detect")
def api_detect(body: DetectBody):
    """Return PHI spans for redaction."""
    spans = detect(body.text)
    logger.info("POST /detect text_len=%s span_count=%s", len(body.text), len(spans))
    return {"spans": spans}


@app.post("/rag")
def api_rag(body: RagBody):
    """Return top_k clinical knowledge chunks for RAG context."""
    results = rag_query(body.query, body.top_k)
    logger.info("POST /rag query_len=%s top_k=%s chunk_count=%s", len(body.query), body.top_k, len(results))
    return {"results": results}


@app.get("/health")
def health():
    """Liveness + ML vs regex: USE_ML, local phi_model, ner_mode, PHI_DETECTION_MODE."""
    base = Path(__file__).resolve().parent
    default_phi = base / "phi_model"
    model_dir = Path(os.environ.get("PHI_MODEL_PATH", str(default_phi)))
    use_ml = os.environ.get("USE_ML", "1") == "1"
    has_config = model_dir.is_dir() and (model_dir / "config.json").exists()
    if not use_ml:
        ner_mode = "regex_only"
    elif has_config:
        ner_mode = "local_phi_model"
    else:
        ner_mode = "dslim_fallback"
    det = get_detection_settings()
    logger.info(
        "GET /health ner_mode=%s pipeline=%s mode=%s",
        ner_mode,
        det.get("detection_pipeline"),
        det.get("phi_detection_mode"),
    )
    return {
        "status": "ok",
        "use_ml": use_ml,
        "phi_model_dir": str(model_dir),
        "phi_model_has_config": has_config,
        "ner_mode": ner_mode,
        # backwards compatibility
        "phi_model_loaded": has_config,
        "phi_model_path": str(model_dir),
        **det,
    }
