"""
Hybrid PHI detector: regex (IDs, dates, contact), entropy (random tokens), optional NER (names).
Returns list of {start, end, category, text} spans.
When USE_ML=1, loads from phi_model/ (or PHI_MODEL_PATH) if present; else uses dslim/bert-base-NER.
Label mapping: uses label_map.json id2label when present (B-PHI/I-PHI -> PHI; B-NAME -> NAME etc.).
See docs/DATASET_CLEANUP.md and train_phi_model.py for training and model path.

**PHI_DETECTION_MODE** (env):
- `both` (default): regex + patient-line + entropy + NER (if USE_ML=1).
- `regex_only`: rules/heuristics only — no NER.
- `ner_only`: NER only — no regex/patient-line/entropy (requires USE_ML=1).
"""
import json
import logging
import re
import math
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Default path for trained model (same as train_phi_model.py output)
_DEFAULT_PHI_MODEL_DIR = Path(__file__).resolve().parent / "phi_model"

# --- Regex patterns (HIPAA / common PHI; Kenya 8-digit national ID) ---
PATTERNS = [
    (r"\b\d{3}-\d{2}-\d{4}\b", "SSN"),
    (r"\bMRN\s*:?\s*\d{6,}\b", "MRN"),
    (r"\b(?:National\s+ID|ID\s+No\.?)\s*:?\s*\d{8}\b", "KENYA_NATIONAL_ID"),  # Kenya 8-digit national ID
    (r"\b\d{10,}\b", "ID_NUMBER"),  # long numeric IDs
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "EMAIL"),
    # "+1 (555) 123-4567" / "+1 (415) 555-0199" (no leading \b — \b before "+" is unreliable). List before generic PHONE.
    (r"\+1\s*\(\d{3}\)\s*\d{3}\s*[-.]?\s*\d{4}\b", "PHONE"),
    # US 10-digit; \s* after optional parens so "(555) 123-4567" matches
    (r"\b(?:\+?1[-.]?)?\(?\d{3}\)?\s*[-.]?\d{3}[-.]?\d{4}\b", "PHONE"),
    (r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", "DATE"),
    (r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b", "DATE"),
    (r"\b\d{4}-\d{2}-\d{2}\b", "DATE"),
]

# Terms that are clinically meaningful but not direct identifiers; keep visible for model quality.
_NON_PHI_EXACT = frozenset(
    {
        "a1c",
        "egfr",
        "ldl",
        "hdl",
        "triglycerides",
        "metformin",
        "lisinopril",
        "atorvastatin",
        "insulin",
        "amlodipine",
        "losartan",
        "bullet",
        "points",
    }
)
_NON_PHI_UNITS = frozenset({"mg", "g", "kg", "ml", "mcg", "bid", "tid", "qid", "qd", "po", "iv"})

# Numeric clinical patterns commonly useful for reasoning (not direct identifiers by themselves).
_NON_PHI_NUMERIC_PATTERNS = [
    re.compile(r"^\d+(\.\d+)?%$"),          # e.g., 8.4%
    re.compile(r"^\d+/\d+$"),               # e.g., 152/94
    re.compile(r"^\d+(\.\d+)?$"),           # plain scalar
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


# First token after "Patient:" that are usually not person names (avoid false positives).
_PATIENT_NAME_BLOCKLIST = frozenset(
    {
        "stable", "alert", "doing", "see", "follow", "per", "the", "this", "same", "above",
        "below", "denies", "reports", "states", "unknown", "listed", "room",
    }
)


def _patient_line_name_scan(text: str) -> list[dict[str, Any]]:
    """`Patient: First Last,` on sign-out lines (regex; complements NER). Requires a comma after the name."""
    out = []
    # EMR handoffs usually use "Patient: Jane Doe, MRN ..." — comma reduces false positives vs free text.
    for m in re.finditer(
        r"(?i)\bPatient:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\s*,",
        text,
    ):
        name = m.group(1)
        first = name.split()[0].lower()
        if first in _PATIENT_NAME_BLOCKLIST:
            continue
        start, end = m.start(1), m.end(1)
        out.append({"start": start, "end": end, "category": "NAME", "text": text[start:end]})
    return out


def _followup_name_scan(text: str) -> list[dict[str, Any]]:
    """`for First Last,` after phrases like office follow-up (full name as one span)."""
    out = []
    for m in re.finditer(r"(?i)\bfor\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)\s*,", text):
        start, end = m.start(1), m.end(2)
        out.append({"start": start, "end": end, "category": "NAME", "text": text[start:end]})
    return out


def _doctor_name_scan(text: str) -> list[dict[str, Any]]:
    """Catch clinician/provider names like `Dr. Kevin Hart`."""
    out = []
    for m in re.finditer(r"(?i)\bDr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})", text):
        start, end = m.start(1), m.end(1)
        out.append({"start": start, "end": end, "category": "NAME", "text": text[start:end]})
    return out


def _facility_scan(text: str) -> list[dict[str, Any]]:
    """Catch common facility names like `Riverside Family Clinic`."""
    out = []
    for m in re.finditer(
        r"\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+(?:Clinic|Hospital|Medical\s+Center|Health\s+Center|Center))\b",
        text,
    ):
        start, end = m.start(1), m.end(1)
        out.append({"start": start, "end": end, "category": "ENTITY", "text": text[start:end]})
    return out


def _context_name_scan(text: str) -> list[dict[str, Any]]:
    """
    Catch patient-style names with strong local context.
    Examples:
    - `note for Maria Thompson,`
    - `seen today at ... by Dr ...` (handled separately for doctor)
    """
    out = []
    for m in re.finditer(
        r"(?i)\b(?:note\s+for|follow-?up\s+for|case\s+discussion:\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b",
        text,
    ):
        start, end = m.start(1), m.end(1)
        out.append({"start": start, "end": end, "category": "NAME", "text": text[start:end]})
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


def _label_id_to_category(pred_id: int, id2label: dict[str, str]) -> str:
    """Map label id to span category (e.g. B-PHI -> PHI, B-NAME -> NAME)."""
    label = id2label.get(str(pred_id), "O")
    if label == "O":
        return ""
    if label.startswith("B-") or label.startswith("I-"):
        return label[2:]  # PHI, NAME, etc.
    return "PHI"


def _merge_adjacent_spans(text: str, spans: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Merge spans that only have whitespace, nothing, or a short separator (- / .) between them.
    Fixes token-level NER splitting names, drug names, and vitals like 148-155.
    """
    if len(spans) < 2:
        return spans
    mergeable = frozenset({"PHI", "NAME", "ENTITY", "HIGH_ENTROPY"})

    def can_merge_cats(a: str, b: str) -> bool:
        if a == b:
            return a in mergeable
        # NER may mix NAME (PER) with PHI (token model); merge into one name-like span
        if a in mergeable and b in mergeable and {a, b} <= {"PHI", "NAME"}:
            return True
        return False

    spans = sorted(spans, key=lambda s: (s["start"], -s["end"]))
    merged: list[dict[str, Any]] = []
    for s in spans:
        if not merged:
            merged.append(dict(s))
            continue
        last = merged[-1]
        a, b = last.get("category", "PHI"), s.get("category", "PHI")
        if not can_merge_cats(a, b):
            merged.append(dict(s))
            continue
        gap = text[last["end"] : s["start"]]
        ok_gap = (
            gap == ""
            or (not gap.strip())
            or (len(gap) <= 3 and all(c in "-/. " for c in gap))
        )
        if not ok_gap:
            merged.append(dict(s))
            continue
        last["end"] = s["end"]
        last["category"] = "NAME" if a == "NAME" or b == "NAME" else a
        last["text"] = text[last["start"] : last["end"]]
    return merged


def _apply_span_merges(text: str, spans: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Overlap merge, then adjacent merge (run twice so chains collapse)."""
    out = _merge_spans(spans)
    out = _merge_adjacent_spans(text, out)
    out = _merge_adjacent_spans(text, out)
    return _merge_spans(out)


def _is_non_phi_token(token: str) -> bool:
    t = token.strip().lower()
    if not t:
        return False
    if t in _NON_PHI_EXACT:
        return True
    # Multi-word phrases like "metformin 1000 mg" / "A1c 8.4%" / "58 mg"
    parts = [p for p in re.split(r"\s+", t) if p]
    if len(parts) > 1:
        all_ok = True
        for p in parts:
            if p in _NON_PHI_EXACT or p in _NON_PHI_UNITS:
                continue
            if any(rx.match(p) for rx in _NON_PHI_NUMERIC_PATTERNS):
                continue
            all_ok = False
            break
        if all_ok:
            return True
    if any(p.match(t) for p in _NON_PHI_NUMERIC_PATTERNS):
        return True
    return False


def _filter_non_phi_spans(spans: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Keep strict identifiers, drop over-broad PHI-like spans that hurt clinical utility.
    Never drops explicit identifier categories like NAME/MRN/DATE/EMAIL/PHONE.
    """
    strict_keep_cats = frozenset(
        {
            "NAME",
            "MRN",
            "DATE",
            "EMAIL",
            "PHONE",
            "SSN",
            "KENYA_NATIONAL_ID",
            "ID_NUMBER",
            "ENTITY",
        }
    )
    out: list[dict[str, Any]] = []
    for s in spans:
        cat = str(s.get("category", "PHI")).upper()
        txt = str(s.get("text", "")).strip()
        if cat in strict_keep_cats:
            out.append(s)
            continue
        # For broad PHI/entropy buckets, keep only when token does not match common non-PHI clinical content.
        if cat in {"PHI", "HIGH_ENTROPY"} and _is_non_phi_token(txt):
            continue
        out.append(s)
    return out


# Cached (tokenizer, model, device) per resolved model path — avoids reloading on every request.
_ner_model_cache: dict[str, tuple[Any, Any, Any]] = {}


def _get_cached_ner(model_dir: Path) -> tuple[Any, Any, Any] | None:
    """Load and cache token classifier once per process."""
    key = str(model_dir.resolve())
    if key in _ner_model_cache:
        return _ner_model_cache[key]
    try:
        from transformers import AutoModelForTokenClassification, AutoTokenizer
        import torch

        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
        model = AutoModelForTokenClassification.from_pretrained(str(model_dir))
        device = next(model.parameters()).device
        model.eval()
        _ner_model_cache[key] = (tokenizer, model, device)
        return _ner_model_cache[key]
    except Exception:
        return None


def _load_id2label(model_dir: Path, model: Any) -> dict[str, str]:
    """
    Resolve id->label map for local token classifier.
    Priority:
    1) label_map.json in model dir (if provided by training pipeline)
    2) model.config.id2label from transformers config
    """
    # 1) Optional explicit map file
    map_file = model_dir / "label_map.json"
    if map_file.exists():
        try:
            data = json.loads(map_file.read_text(encoding="utf-8"))
            # Expected shape: {"id2label": {"0":"O","1":"B-PHI",...}}
            id2label = data.get("id2label") if isinstance(data, dict) else None
            if isinstance(id2label, dict) and id2label:
                return {str(k): str(v) for k, v in id2label.items()}
        except Exception:
            pass

    # 2) transformers config
    cfg = getattr(model, "config", None)
    raw = getattr(cfg, "id2label", None) if cfg is not None else None
    if isinstance(raw, dict) and raw:
        return {str(k): str(v) for k, v in raw.items()}

    # Safe default for binary PHI token classifiers (O / B-PHI / I-PHI)
    return {"0": "O", "1": "B-PHI", "2": "I-PHI"}


def _ner_spans_local(model_dir: Path, text: str) -> list[dict[str, Any]]:
    """Run token classification from trained phi_model; map token predictions to character spans."""
    try:
        import torch

        loaded = _get_cached_ner(model_dir)
        if loaded is None:
            return []
        tokenizer, model, device = loaded
        id2label = _load_id2label(model_dir, model)
        enc = tokenizer(text, return_offsets_mapping=True, truncation=True, max_length=512)
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
            category = _label_id_to_category(pred_id, id2label)
            if not category:
                continue
            out.append({"start": start, "end": end, "category": category, "text": text[start:end]})
        return _merge_spans(out) if out else []
    except Exception as e:
        logger.warning("phi_model NER failed, using regex+entropy only: %s", e)
        return []


def _parse_detection_mode() -> str:
    """Return one of: both | regex_only | ner_only."""
    raw = os.environ.get("PHI_DETECTION_MODE", "both").strip().lower()
    if raw in ("both", "regex_only", "ner_only"):
        return raw
    return "both"


def get_detection_settings() -> dict[str, Any]:
    """Resolved mode for GET /health (no import of detect side effects)."""
    mode = _parse_detection_mode()
    use_ml = os.environ.get("USE_ML", "1") == "1"
    if mode == "regex_only":
        pipeline = "regex_only"
    elif mode == "ner_only":
        pipeline = "ner_only" if use_ml else "ner_only_disabled"
    else:
        pipeline = "full" if use_ml else "regex_only"
    return {
        "phi_detection_mode": mode,
        "use_ml": use_ml,
        "detection_pipeline": pipeline,
    }


def _ner_spans(text: str) -> list[dict[str, Any]]:
    """Optional NER: load from phi_model/ if present (USE_ML=1), else dslim/bert-base-NER. Lazy-load. Graceful fallback if model missing."""
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
    """Run regex + entropy + optional NER; merge and return spans (see PHI_DETECTION_MODE)."""
    mode = _parse_detection_mode()
    use_ml = os.environ.get("USE_ML", "1") == "1"

    if mode == "ner_only":
        if not use_ml:
            return []
        merged = _apply_span_merges(text, _ner_spans(text))
        return _filter_non_phi_spans(merged)

    if mode == "regex_only":
        spans = (
            _regex_scan(text)
            + _patient_line_name_scan(text)
            + _entropy_scan(text)
            + _followup_name_scan(text)
            + _doctor_name_scan(text)
            + _facility_scan(text)
            + _context_name_scan(text)
        )
        merged = _apply_span_merges(text, spans)
        return _filter_non_phi_spans(merged)

    # both
    spans = (
        _regex_scan(text)
        + _patient_line_name_scan(text)
        + _entropy_scan(text)
        + _followup_name_scan(text)
        + _doctor_name_scan(text)
        + _facility_scan(text)
        + _context_name_scan(text)
    )
    if use_ml:
        spans += _ner_spans(text)
    merged = _apply_span_merges(text, spans)
    return _filter_non_phi_spans(merged)
