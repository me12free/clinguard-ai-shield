"""
Hybrid PHI detector: regex (IDs, dates, contact), entropy (random tokens), optional NER (names).
Returns list of {start, end, category, text} spans.
"""
import re
import math
import os
from typing import Any

# --- Regex patterns (HIPAA / common PHI) ---
PATTERNS = [
    (r"\b\d{3}-\d{2}-\d{4}\b", "SSN"),
    (r"\bMRN\s*:?\s*\d{6,}\b", "MRN"),
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


def _ner_spans(text: str) -> list[dict[str, Any]]:
    """Optional NER: map PER/LOC/ORG to PHI categories. Lazy-load to avoid slow startup."""
    use_ml = os.environ.get("USE_ML", "1") == "1"
    if not use_ml:
        return []
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
