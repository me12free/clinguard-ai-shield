"""
Exploratory Data Analysis (EDA) for PHI datasets. Step 2 in the ML process.
Run on data/raw (after acquire) or data/cleaned (after clean_phi_data.py).
Output: printed insights and optional eda_insights.json in the data dir.

Usage (from detection_engine/):
  python scripts/eda_phi_data.py
  PHI_DATA_DIR=data/raw python scripts/eda_phi_data.py
  PHI_DATA_DIR=data/cleaned python scripts/eda_phi_data.py
  PHI_EDA_OUT=1 python scripts/eda_phi_data.py   # write eda_insights.json
"""
import json
import os
import sys
from pathlib import Path
from collections import Counter

SCRIPT_DIR = Path(__file__).resolve().parent
DETECTION_ENGINE_ROOT = SCRIPT_DIR.parent
DEFAULT_DATA_DIR = DETECTION_ENGINE_ROOT / "data" / "cleaned"


def load_records(data_dir: Path) -> list[dict]:
    """Load records from data_dir: either cleaned (train/val/test.json) or raw (JSONL)."""
    data_dir = Path(data_dir)
    records = []

    # Cleaned: train.json, val.json, test.json
    for name in ("train", "val", "test"):
        p = data_dir / f"{name}.json"
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                records.extend(data)
            else:
                records.append(data)

    if records:
        return records

    # Raw: synthetic_phi.jsonl and subdirs (pii_masking_65k, etc.)
    synthetic = data_dir / "synthetic_phi.jsonl"
    if synthetic.exists():
        with open(synthetic, "r", encoding="utf-8-sig") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    for subdir in data_dir.iterdir() if data_dir.exists() else []:
        if not subdir.is_dir():
            continue
        if subdir.name.startswith("pii_masking") or subdir.name.startswith("n2c2_"):
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


def normalize_text(s: str) -> str:
    if not s or not isinstance(s, str):
        return ""
    return " ".join(str(s).strip().split())


def extract_text_and_spans(rec: dict) -> tuple[str, list]:
    """Return (text, spans) for a record. Spans: list of {start, end, category}."""
    text = (rec.get("text") or rec.get("content") or "")
    if isinstance(text, list):
        text = text[0] if text else ""
    text = normalize_text(str(text))

    spans = rec.get("spans") or rec.get("entities") or rec.get("labels") or []
    if isinstance(spans, str):
        try:
            spans = json.loads(spans)
        except json.JSONDecodeError:
            spans = []
    out = []
    for s in spans:
        if isinstance(s, dict):
            start = s.get("start", s.get("offset", 0))
            end = s.get("end", s.get("offset", 0) + (s.get("length", 0)))
            cat = (s.get("category") or s.get("type") or s.get("label") or "PHI").upper().replace("-", "_")
        elif isinstance(s, (list, tuple)) and len(s) >= 3:
            start, end = s[0], s[1]
            cat = (s[2] if len(s) > 2 else "PHI").upper().replace("-", "_") if isinstance(s[2], str) else "PHI"
        else:
            continue
        out.append({"start": int(start), "end": int(end), "category": cat})
    return text, out


def main():
    data_dir = Path(os.environ.get("PHI_DATA_DIR", str(DEFAULT_DATA_DIR)))
    # Resolve relative paths against detection_engine root so Colab works regardless of cwd
    if not data_dir.is_absolute():
        data_dir = (DETECTION_ENGINE_ROOT / data_dir).resolve()
    write_json = os.environ.get("PHI_EDA_OUT", "").strip().lower() in ("1", "true", "yes")

    print("EDA data dir (resolved):", data_dir)
    records = load_records(data_dir)
    if not records:
        print("No records found in", data_dir)
        print("  - For raw: run acquire_datasets.py first (from detection_engine/).")
        print("  - For cleaned: run clean_phi_data.py first. Check that PHI_DATA_DIR points to the right folder.")
        sys.exit(1)

    n = len(records)
    cat_counts: Counter = Counter()
    text_lengths = []
    samples_per_cat: dict[str, str] = {}

    for r in records:
        text, spans = extract_text_and_spans(r)
        text_lengths.append(len(text))
        for s in spans:
            cat = s.get("category", "PHI")
            cat_counts[cat] += 1
            if cat not in samples_per_cat and text:
                # Store a short sample (first 80 chars around the span)
                start, end = s.get("start", 0), s.get("end", 0)
                sample = text[max(0, start - 20) : min(len(text), end + 20)]
                if len(sample) > 80:
                    sample = sample[:77] + "..."
                samples_per_cat[cat] = sample

    text_lengths.sort()
    min_len = min(text_lengths) if text_lengths else 0
    max_len = max(text_lengths) if text_lengths else 0
    mean_len = sum(text_lengths) / len(text_lengths) if text_lengths else 0

    # Print insights (Step 2 EDA)
    print("=== EDA insights (ML process Step 2) ===\n")
    print("Data dir:", data_dir)
    print("Total records:", n)
    print("\nText length (characters):")
    print("  min:", min_len, " max:", max_len, " mean:", f"{mean_len:.1f}")
    print("\nLabel distribution (span counts per category):")
    for cat, count in cat_counts.most_common():
        print(f"  {cat}: {count}")
    print("\nSample snippet per category (first occurrence):")
    for cat in sorted(samples_per_cat.keys()):
        print(f"  {cat}: {samples_per_cat[cat]!r}")

    insights = {
        "data_dir": str(data_dir),
        "n_records": n,
        "text_length": {"min": min_len, "max": max_len, "mean": round(mean_len, 2)},
        "label_distribution": dict(cat_counts),
        "samples_per_category": samples_per_cat,
    }

    if write_json:
        out_path = data_dir / "eda_insights.json"
        data_dir.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(insights, f, indent=2)
        print("\nWritten:", out_path)
    else:
        print("\nTo write eda_insights.json, set PHI_EDA_OUT=1 and re-run.")


if __name__ == "__main__":
    main()
