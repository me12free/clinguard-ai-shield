"""FastAPI engine: health, detect (regex path; no torch required)."""
from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ["USE_ML"] = "0"
from main import app  # noqa: E402

client = TestClient(app)
PHI_MODEL = Path(__file__).resolve().parent.parent / "phi_model" / "config.json"


def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


def test_health_phi_model_flag():
    r = client.get("/health")
    data = r.json()
    assert "phi_model_loaded" in data
    if PHI_MODEL.exists():
        assert data["phi_model_loaded"] is True


def test_detect_empty():
    r = client.post("/detect", json={"text": ""})
    assert r.status_code == 200
    assert r.json()["spans"] == []


def test_detect_ssn():
    r = client.post("/detect", json={"text": "SSN 123-45-6789 on file."})
    assert r.status_code == 200
    spans = r.json()["spans"]
    assert len(spans) >= 1
    assert any(s.get("category") == "SSN" for s in spans)


def test_detect_max_length_validation():
    r = client.post("/detect", json={"text": "x" * 50_001})
    assert r.status_code == 422


def test_detect_large_but_valid():
    body = "word " * 5000 + "123-45-6789"
    r = client.post("/detect", json={"text": body})
    assert r.status_code == 200
    assert len(r.json()["spans"]) >= 1
