"""
Hybrid PHI detector: regex (IDs, dates, contact), entropy (random tokens), optional NER (names).
Returns list of {start, end, category, text} spans.
When USE_ML=1, loads from phi_model/ (or PHI_MODEL_PATH) if present; else uses dslim/bert-base-NER.
See docs/DATASET_CLEANUP.md and train_phi_model.py for training and model path.
"""
import re
import math
import os
from pathlib import Path
from typing import Any

# Default path for trained model (same as train_phi_model.py output)
_DEFAULT_PHI_MODEL_DIR = Path(__file__).resolve().parent / "phi_model"

# --- Regex patterns (HIPAA / common PHI; Kenya 8-digit national ID) ---
PATTERNS = [
    (r"\b\d{3}-\d{2}-\d{4}\b", "SSN"),
    (r"\bMRN\s*:?\s*\d{6,}\b", "MRN"),
    (r"\b(?:National\s+ID|ID\s+No\.?)\s*:?\s*\d{8}\b", "KENYA_NATIONAL_ID"),  # Kenya 8-digit national ID
    (r"\b\d{10,}\b", "ID_NUMBER"),  # long numeric IDs
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "EMAIL"),
    (r"\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b", "PHONE"),
    (r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", "DATE"),
    (r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b", "DATE"),
    (r"\b\d{4}-\d{2}-\d{2}\b", "DATE"),
]


def _entropy(s: str) -> float:
    """Shannon entropy; high => random-looking (e.g. IDs)."""
    if not s or len(s) < 4:
        return 0.0
    n = len(s)
    counts: dict[str, int] = {}
    for c in s:
        counts[c] = counts.get(c, 0) + 1
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def _regex_scan(text: str) -> list[dict[str, Any]]:
    out = []
    for pat, category in PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            out.append({"start": m.start(), "end": m.end(), "category": category, "text": m.group()})
    return out


def _entropy_scan(text: str, threshold: float = 3.5, min_len: int = 6) -> list[dict[str, Any]]:
    """Flag tokens with high entropy (e.g. random alphanumeric IDs)."""
    out = []
    for m in re.finditer(r"[A-Za-z0-9]+", text):
        token = m.group()
        if len(token) >= min_len and _entropy(token) >= threshold:
            out.append({"start": m.start(), "end": m.end(), "category": "HIGH_ENTROPY", "text": token})
    return out


def _merge_spans(spans: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Dedupe overlapping spans: keep first by start, merge overlaps into one."""
    if not spans:
        return []
    sorted_spans = sorted(spans, key=lambda s: (s["start"], -s["end"]))
    merged = [sorted_spans[0]]
    for s in sorted_spans[1:]:
        last = merged[-1]
        if s["start"] < last["end"]:
            last["end"] = max(last["end"], s["end"])
            last["category"] = last.get("category", "PHI")
            continue
        merged.append(s)
    return merged


def _ner_spans_local(model_dir: Path, text: str) -> list[dict[str, Any]]:
    """Run token classification from trained phi_model; map token predictions to character spans."""
    try:
        from transformers import AutoModelForTokenClassification, AutoTokenizer
        import torch
        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
        model = AutoModelForTokenClassification.from_pretrained(str(model_dir))
        enc = tokenizer(text, return_offsets_mapping=True, truncation=True, max_length=512)
        device = next(model.parameters(), None)
        device = device.device if device is not None else torch.device("cpu")
        model = model.to(device)
        with torch.no_grad():
            logits = model(
                input_ids=torch.tensor([enc["input_ids"]], device=device),
                attention_mask=torch.tensor([enc["attention_mask"]], device=device),
            ).logits
        preds = logits[0].argmax(-1).cpu().tolist()
        out = []
        for (start, end), pred_id in zip(enc["offset_mapping"], preds):
            if start == 0 and end == 0:
                continue
            if pred_id == 0:  # O
                continue
            # B-PHI=1, I-PHI=2: treat both as PHI
            out.append({"start": start, "end": end, "category": "PHI", "text": text[start:end]})
        # Merge adjacent PHI spans
        return _merge_spans(out) if out else []
    except Exception:
        return []


def _ner_spans(text: str) -> list[dict[str, Any]]:
    """Optional NER: load from phi_model/ if present (USE_ML=1), else dslim/bert-base-NER. Lazy-load."""
    use_ml = os.environ.get("USE_ML", "1") == "1"
    if not use_ml:
        return []
    model_path = os.environ.get("PHI_MODEL_PATH", str(_DEFAULT_PHI_MODEL_DIR))
    model_dir = Path(model_path)
    if model_dir.is_dir() and (model_dir / "config.json").exists():
        return _ner_spans_local(model_dir, text)
    try:
        from transformers import pipeline
        ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
        entities = ner(text)
        out = []
        for e in entities:
            start = e["start"]
            end = e["end"]
            label = e["entity_group"]
            if label == "PER":
                cat = "NAME"
            elif label in ("LOC", "ORG"):
                cat = "ENTITY"
            else:
                cat = "PHI"
            out.append({"start": start, "end": end, "category": cat, "text": e.get("word", text[start:end])})
        return out
    except Exception:
        return []


def detect(text: str) -> list[dict[str, Any]]:
    """Run regex + entropy + optional NER; merge and return spans."""
    spans = _regex_scan(text) + _entropy_scan(text) + _ner_spans(text)
    return _merge_spans(spans)
