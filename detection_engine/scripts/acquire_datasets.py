"""
Acquire PHI datasets for ClinGuard training.
Primary (no sign-up): ai4privacy/pii-masking-65k and pii-masking-300k from Hugging Face;
  output: data/raw/pii_masking_65k/pii_masking_65k.jsonl (and pii_masking_300k/).
Optional: n2c2 2006/2014 (often gated; DBMI registration required for official data).
Always: synthetic data -> data/raw/synthetic_phi.jsonl.
See docs/DATASET_ACQUISITION.md and I2B2_N2C2_DATASETS.md.
Usage (from detection_engine/ with venv):
  python scripts/acquire_datasets.py
"""
import json
import random
import sys
from pathlib import Path

# Ensure we can import from detection_engine
SCRIPT_DIR = Path(__file__).resolve().parent
DETECTION_ENGINE_ROOT = SCRIPT_DIR.parent
if str(DETECTION_ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(DETECTION_ENGINE_ROOT))

RAW_DIR = DETECTION_ENGINE_ROOT / "data" / "raw"

# BigBio PHI datasets: (dataset_id, output_subdir, output_filename)
N2C2_DEID_DATASETS = [
    ("bigbio/n2c2_2006_deid", "n2c2_2006", "n2c2_2006_deid.jsonl"),
    ("bigbio/n2c2_2014_deid", "n2c2_2014", "n2c2_2014_deid.jsonl"),
]

# Map n2c2/i2b2 PHI types to ClinGuard categories (Chapter 4 / phi_detector)
N2C2_TO_CLINGUARD = {
    "PATIENT": "NAME",
    "DOCTOR": "NAME",
    "NAME": "NAME",
    "LOCATION": "ENTITY",
    "DATE": "DATE",
    "AGE": "DATE",
    "CONTACT": "PHONE",
    "PHONE": "PHONE",
    "FAX": "PHONE",
    "EMAIL": "EMAIL",
    "ID": "ID_NUMBER",
    "MEDICALRECORD": "MRN",
    "SSN": "SSN",
    "IDNUM": "ID_NUMBER",
    "ORGANIZATION": "ENTITY",
    "OTHER": "PHI",
}


def _bigbio_item_to_record(item):
    """Extract (text, spans) from one BigBio NER item. Returns (text, spans) or (None, None)."""
    text = None
    if "passages" in item and item["passages"]:
        for p in item["passages"]:
            if p.get("type") == "paragraph" or "text" in p:
                text = (p.get("text") or [""])[0]
                break
    if text is None and "text" in item:
        text = item["text"] if isinstance(item["text"], str) else (item["text"][0] if item["text"] else "")
    if not text:
        return None, None
    entities = []
    if "entities" in item:
        for ent in item["entities"]:
            offs = ent.get("offsets", [])
            if not offs:
                continue
            start, end = offs[0][0], offs[0][1]
            if start < 0 or end > len(text):
                continue
            etype = (ent.get("type") or "PHI").upper().replace("-", "_")
            category = N2C2_TO_CLINGUARD.get(etype, "PHI")
            entities.append({"start": start, "end": end, "category": category})
    if not entities:
        return None, None
    return text, sorted(entities, key=lambda x: x["start"])


def try_load_bigbio_deid(dataset_id: str, out_dir: Path, out_filename: str):
    """Load a BigBio NER de-id dataset and save as JSONL. Returns (success, count or error message)."""
    try:
        from datasets import load_dataset
    except ImportError:
        return False, "datasets not installed (pip install datasets)"
    try:
        # BigBio datasets may use legacy loading scripts (no longer supported in newer datasets lib).
        # If this fails, use official DBMI portal: https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/
        ds = load_dataset(dataset_id)
    except Exception as e:
        return False, str(e)
    records = []
    for split in ("train", "validation", "test"):
        if split not in ds:
            continue
        for item in ds[split]:
            text, spans = _bigbio_item_to_record(item)
            if text is None:
                continue
            records.append({"text": text, "spans": spans})
    if not records:
        return False, "Dataset loaded but no valid records extracted (schema may differ)"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / out_filename
    with open(out_file, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return True, len(records)


# Public PII/PHI datasets (no DUA): Hugging Face dataset_id -> (output_subdir, output_filename)
# ai4privacy: token-level BIO; we convert to text + spans
PUBLIC_PII_DATASETS = [
    ("ai4privacy/pii-masking-65k", "pii_masking_65k", "pii_masking_65k.jsonl"),
    ("ai4privacy/pii-masking-300k", "pii_masking_300k", "pii_masking_300k.jsonl"),
]

# Map ai4privacy / generic PII labels to ClinGuard categories
PII_TO_CLINGUARD = {
    "FIRSTNAME": "NAME",
    "LASTNAME": "NAME",
    "MIDDLENAME": "NAME",
    "PREFIX": "NAME",
    "NAME": "NAME",
    "EMAIL": "EMAIL",
    "PHONE": "PHONE",
    "DATE": "DATE",
    "TIME": "DATE",
    "SSN": "SSN",
    "IDNUM": "ID_NUMBER",
    "LICENSE": "ID_NUMBER",
    "ACCOUNT": "ID_NUMBER",
    "ADDRESS": "ENTITY",
    "STREET": "ENTITY",
    "CITY": "ENTITY",
    "ZIP": "ENTITY",
    "COMPANY_NAME": "ENTITY",
    "JOBDESCRIPTOR": "ENTITY",
    "JOBTITLE": "ENTITY",
    "JOBAREA": "ENTITY",
}


def _tokens_labels_to_spans(tokens: list, labels: list) -> tuple[str, list]:
    """Convert token list + BIO labels to (text, spans). Tokens may have ## prefix (no space before)."""
    if not tokens or not labels or len(tokens) != len(labels):
        return "", []
    parts = []
    positions = []  # (start, end) per token in final text
    pos = 0
    for i, tok in enumerate(tokens):
        s = tok if isinstance(tok, str) else str(tok)
        if s.startswith("##"):
            s = s[2:]
            sep = ""
        else:
            sep = " " if parts else ""
        start = pos
        text_seg = sep + s
        pos += len(text_seg)
        end = pos
        parts.append(text_seg)
        positions.append((start, end))
    text = "".join(parts)
    # Build spans from consecutive B-X / I-X
    spans = []
    i = 0
    while i < len(labels):
        lbl = labels[i] if i < len(labels) else "O"
        if isinstance(lbl, (int, float)):
            i += 1
            continue
        lbl = (lbl or "O").strip().upper()
        if lbl == "O" or lbl == "0":
            i += 1
            continue
        if lbl.startswith("B-"):
            cat = lbl[2:].replace("-", "_")
            span_start, span_end = positions[i]
            j = i + 1
            while j < len(labels):
                next_lbl = (labels[j] or "O").strip().upper()
                if next_lbl.startswith("I-") and next_lbl[2:].replace("-", "_") == cat:
                    span_end = positions[j][1]
                    j += 1
                else:
                    break
            category = PII_TO_CLINGUARD.get(cat, "PHI")
            spans.append({"start": span_start, "end": span_end, "category": category})
            i = j
        else:
            i += 1
    return text, sorted(spans, key=lambda x: x["start"])


def try_load_pii_masking(dataset_id: str, out_dir: Path, out_filename: str, max_rows: int | None = None):
    """Load ai4privacy pii-masking and convert token+BIO to text+spans. Returns (success, count or error)."""
    try:
        from datasets import load_dataset
    except ImportError:
        return False, "datasets not installed (pip install datasets)"
    try:
        ds = load_dataset(dataset_id)
    except Exception as e:
        return False, str(e)
    records = []
    for split in ("train", "validation", "test"):
        if split not in ds:
            continue
        d = ds[split]
        tokens_col = "tokenised_unmasked_text" if "tokenised_unmasked_text" in d.column_names else "tokens"
        labels_col = "token_entity_labels" if "token_entity_labels" in d.column_names else "ner_tags"
        if tokens_col not in d.column_names or labels_col not in d.column_names:
            continue
        n = 0
        for row in d:
            if max_rows and len(records) >= max_rows:
                break
            tokens = row.get(tokens_col) or []
            labels = row.get(labels_col) or []
            text, spans = _tokens_labels_to_spans(tokens, labels)
            if not text.strip() or not spans:
                continue
            records.append({"text": text, "spans": spans})
            n += 1
    if not records:
        return False, "Dataset loaded but no valid records (missing tokens/labels or empty)"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / out_filename
    with open(out_file, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return True, len(records)


def run_synthetic_generator(count: int = 2000):
    """Run the synthetic PHI generator. Writes to data/raw/synthetic_phi.jsonl."""
    sys.path.insert(0, str(SCRIPT_DIR))
    from generate_synthetic_phi import generate_one, DEFAULT_OUTPUT
    random.seed(42)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    out = DEFAULT_OUTPUT
    with open(out, "w", encoding="utf-8") as f:
        for _ in range(count):
            record = generate_one()
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    return out, count


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    print("Acquiring PHI datasets for ClinGuard (primary: public PII, no sign-up)...")
    # 1. Public PII datasets (ai4privacy — no registration, no DUA)
    for dataset_id, subdir, out_filename in PUBLIC_PII_DATASETS:
        out_dir = RAW_DIR / subdir
        max_rows = 50_000 if "300k" in dataset_id else None
        ok, result = try_load_pii_masking(dataset_id, out_dir, out_filename, max_rows=max_rows)
        if ok:
            print(f"  {dataset_id}: saved {result} records to {out_dir}")
        else:
            print(f"  {dataset_id}: skipped ({result}).")
    # 2. Optional: n2c2 (often gated or deprecated scripts; requires DBMI sign-up for official data)
    for dataset_id, subdir, out_filename in N2C2_DEID_DATASETS:
        out_dir = RAW_DIR / subdir
        ok, result = try_load_bigbio_deid(dataset_id, out_dir, out_filename)
        if ok:
            print(f"  {dataset_id}: saved {result} records to {out_dir}")
        else:
            print(f"  {dataset_id}: skipped ({result}). Use pii_masking_65k + synthetic instead (no sign-up).")
    # 3. Synthetic data (in-repo, Kenya-aligned)
    count = int(__import__("os").environ.get("PHI_SYNTHETIC_COUNT", "2000"))
    path, n = run_synthetic_generator(count)
    print(f"  synthetic: wrote {n} examples to {path}")
    print("Done. Next: run clean_phi_data.py then train_phi_model.py.")


if __name__ == "__main__":
    main()
