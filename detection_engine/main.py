"""
ClinGuard detection + RAG API. Run: uvicorn main:app --host 0.0.0.0 --port 8001
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from phi_detector import detect
from rag_engine import rag_query

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
    return {"spans": spans}


@app.post("/rag")
def api_rag(body: RagBody):
    """Return top_k clinical knowledge chunks for RAG context."""
    results = rag_query(body.query, body.top_k)
    return {"results": results}


@app.get("/health")
def health():
    return {"status": "ok"}
