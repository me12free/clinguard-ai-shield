"""
Clean raw PHI data and produce train/val/test splits for ClinGuard training.
Input: detection_engine/data/raw/ (synthetic_phi.jsonl, pii_masking_65k, n2c2_*, etc.).
Output: detection_engine/data/cleaned/train.json, val.json, test.json, stats.json.
Schema: each record {"text": "...", "spans": [{"start", "end", "category"}, ...]}.
Language filter: set KEEP_LANG=en (default) to keep only English for ClinGuard context;
  pii_masking_65k contains French, German, and other languages—filtering avoids non-English noise.
Usage (from detection_engine/ or project root):
  python detection_engine/scripts/clean_phi_data.py
  python scripts/clean_phi_data.py
  KEEP_LANG=  python scripts/clean_phi_data.py   # disable language filter
"""
import json
import os
import re
import sys
from pathlib import Path
from collections import Counter

# Optional: filter by language (e.g. en for ClinGuard; pii_masking_65k has en/fr/de/...)
KEEP_LANG = (os.environ.get("KEEP_LANG") or "en").strip().lower() or None

try:
    from langdetect import detect, LangDetectException
except ImportError:
    detect = None
    LangDetectException = Exception

SCRIPT_DIR = Path(__file__).resolve().parent
DETECTION_ENGINE_ROOT = SCRIPT_DIR.parent
RAW_DIR = DETECTION_ENGINE_ROOT / "data" / "raw"
CLEANED_DIR = DETECTION_ENGINE_ROOT / "data" / "cleaned"
SPLIT_TRAIN, SPLIT_VAL, SPLIT_TEST = 0.70, 0.15, 0.15
SEED = 42

# Valid categories (align with phi_detector and train_phi_model)
VALID_CATEGORIES = {
    "NAME", "MRN", "DATE", "EMAIL", "PHONE", "SSN", "ID_NUMBER",
    "KENYA_NATIONAL_ID", "ENTITY", "HIGH_ENTROPY", "PHI", "O",
}


def normalize_text(s: str) -> str:
    """Normalize for deduplication: strip, collapse whitespace."""
    if not s or not isinstance(s, str):
        return ""
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    return s


def load_raw_records() -> list[dict]:
    """Load all raw records from data/raw (JSONL and JSON)."""
    records = []
    if not RAW_DIR.exists():
        return records
    # synthetic_phi.jsonl
    synthetic_path = RAW_DIR / "synthetic_phi.jsonl"
    if synthetic_path.exists():
        with open(synthetic_path, "r", encoding="utf-8-sig") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    # n2c2 (2006, 2014) and public PII (pii_masking_65k, pii_masking_300k)
    for subdir in RAW_DIR.iterdir():
        if not subdir.is_dir():
            continue
        if subdir.name.startswith("n2c2_") or subdir.name.startswith("pii_masking"):
            for p in subdir.glob("*.jsonl"):
                with open(p, "r", encoding="utf-8-sig") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            records.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
    return records


def normalize_record(rec: dict) -> dict | None:
    """Normalize to {text, spans}; validate; return None if invalid."""
    text = rec.get("text") or rec.get("content") or ""
    if isinstance(text, list):
        text = text[0] if text else ""
    text = str(text).strip()
    if not text:
        return None
    # Ensure UTF-8; strip BOM already handled by utf-8-sig
    text = text.encode("utf-8", errors="replace").decode("utf-8")
    text = normalize_text(text)

    spans = rec.get("spans") or rec.get("entities") or rec.get("labels") or []
    if isinstance(spans, str):
        try:
            spans = json.loads(spans)
        except json.JSONDecodeError:
            spans = []
    out_spans = []
    for s in spans:
        if isinstance(s, dict):
            start = s.get("start", s.get("offset", 0))
            end = s.get("end", s.get("offset", 0) + (s.get("length", 0)))
            cat = (s.get("category") or s.get("type") or s.get("label") or "PHI").upper().replace("-", "_")
        elif isinstance(s, (list, tuple)) and len(s) >= 3:
            start, end, cat = s[0], s[1], (s[2] if len(s) > 2 else "PHI")
            if isinstance(cat, str):
                cat = cat.upper().replace("-", "_")
            else:
                cat = "PHI"
        else:
            continue
        start, end = int(start), int(end)
        if start < 0 or end > len(text) or start >= end:
            continue
        if cat not in VALID_CATEGORIES:
            cat = "PHI"
        out_spans.append({"start": start, "end": end, "category": cat})
    out_spans.sort(key=lambda x: (x["start"], x["end"]))
    return {"text": text, "spans": out_spans}


def filter_by_language(records: list[dict], keep_lang: str) -> tuple[list[dict], int]:
    """Keep only records detected as keep_lang (e.g. 'en'). Returns (filtered_list, dropped_count)."""
    if not keep_lang or not detect:
        return records, 0
    out = []
    dropped = 0
    for r in records:
        text = (r.get("text") or "")[:500]  # langdetect on first 500 chars
        if len(text.strip()) < 15:
            out.append(r)  # keep short text to avoid false drops
            continue
        try:
            lang = detect(text)
            if lang == keep_lang:
                out.append(r)
            else:
                dropped += 1
        except (LangDetectException, Exception):
            out.append(r)  # on detection failure, keep record
    return out, dropped


def deduplicate(records: list[dict]) -> list[dict]:
    """Deduplicate by normalized text; keep first occurrence."""
    seen = set()
    out = []
    for r in records:
        norm = normalize_text(r.get("text", ""))
        if not norm or norm in seen:
            continue
        seen.add(norm)
        out.append(r)
    return out


def main():
    import random
    raw = load_raw_records()
    before_count = len(raw)
    if before_count == 0:
        print("No raw data found in", RAW_DIR, "- run acquire_datasets.py first.")
        sys.exit(1)

    normalized = []
    dropped = 0
    for r in raw:
        nr = normalize_record(r)
        if nr is None:
            dropped += 1
            continue
        normalized.append(nr)
    after_norm = len(normalized)

    # Language filter: keep only KEEP_LANG (e.g. en) for ClinGuard; pii_masking_65k has en/fr/de/etc.
    dropped_language = 0
    if KEEP_LANG and normalized:
        normalized, dropped_language = filter_by_language(normalized, KEEP_LANG)
        if dropped_language:
            print(f"  Language filter (keep={KEEP_LANG}): dropped {dropped_language} non-{KEEP_LANG} records.")

    normalized = deduplicate(normalized)
    after_dedup = len(normalized)

    # Shuffle with fixed seed
    random.seed(SEED)
    random.shuffle(normalized)

    n = len(normalized)
    n_train = int(n * SPLIT_TRAIN)
    n_val = int(n * SPLIT_VAL)
    n_test = n - n_train - n_val
    if n_test < 0:
        n_test = 0
        n_val = n - n_train

    train_data = normalized[:n_train]
    val_data = normalized[n_train : n_train + n_val]
    test_data = normalized[n_train + n_val :]

    CLEANED_DIR.mkdir(parents=True, exist_ok=True)
    for name, data in [("train", train_data), ("val", val_data), ("test", test_data)]:
        out_path = CLEANED_DIR / f"{name}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  {name}.json: {len(data)} records")

    # Label distribution
    cat_counts: Counter = Counter()
    for r in normalized:
        for s in r.get("spans", []):
            cat_counts[s.get("category", "PHI")] += 1
    algorithms = {
        "encoding": "UTF-8 normalisation with error=replace; input read with utf-8-sig to strip BOM",
        "text_normalisation": "Strip leading/trailing whitespace; collapse runs of whitespace to single space (regex \\s+)",
        "span_validation": "Drop spans with start < 0, end > len(text), or start >= end; drop rows with empty text or no valid spans",
        "category_mapping": "Unknown categories mapped to PHI; only VALID_CATEGORIES retained",
        "language_filter": (
            f"Keep only language {KEEP_LANG!r} (langdetect); drop non-{KEEP_LANG} (e.g. French/German in pii_masking_65k). Disable with KEEP_LANG=."
            if KEEP_LANG and detect
            else "No language filter (KEEP_LANG unset or langdetect not installed)."
        ),
        "deduplication": "Exact duplicate removal by normalised text: keep first occurrence, discard later duplicates",
        "train_val_test_split": "Random shuffle with fixed seed (42); 70% train, 15% val, 15% test (no stratification)",
    }
    stats = {
        "before_count": before_count,
        "dropped_invalid": dropped,
        "dropped_language": dropped_language,
        "after_dedup": after_dedup,
        "train": len(train_data),
        "val": len(val_data),
        "test": len(test_data),
        "label_distribution": dict(cat_counts),
        "algorithms_used": algorithms,
        "parameters": {
            "seed": SEED,
            "split_ratio": [SPLIT_TRAIN, SPLIT_VAL, SPLIT_TEST],
            "keep_lang": KEEP_LANG,
        },
    }
    with open(CLEANED_DIR / "stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print("  stats.json: written")
    after_lang = after_norm - dropped_language
    dupes = after_lang - after_dedup
    print(f"Cleanup done: {before_count} raw -> {after_dedup} cleaned (dropped {dropped} invalid, {dropped_language} non-{KEEP_LANG or 'N/A'}, {max(0, dupes)} dupes).")
    print("Next: python train_phi_model.py")


if __name__ == "__main__":
    main()
