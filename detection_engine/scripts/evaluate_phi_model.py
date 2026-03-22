#!/usr/bin/env python3
"""
Token-level evaluation of phi_model on data/cleaned/test.json.
Matches training labels (BIO). If test.json is missing, prints phi_model/eval_report.json.

Usage (from detection_engine/):
  pip install -r requirements.txt
  python scripts/evaluate_phi_model.py

Env: PHI_DATA_DIR, PHI_MODEL_PATH, EVAL_SAMPLE (0 = full test set)
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from train_phi_model import MAX_LENGTH, spans_to_token_labels  # noqa: E402


def main() -> int:
    try:
        import torch
        from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
        from transformers import AutoModelForTokenClassification, AutoTokenizer
    except ImportError as e:
        print("Install: pip install -r requirements.txt", e)
        return 1

    data_dir = Path(os.environ.get("PHI_DATA_DIR", str(ROOT / "data" / "cleaned")))
    model_dir = Path(os.environ.get("PHI_MODEL_PATH", str(ROOT / "phi_model")))
    test_path = data_dir / "test.json"
    report_out = model_dir / "eval_report_local.json"

    if not test_path.exists():
        print("No local test set:", test_path)
        print("Run: python scripts/clean_phi_data.py (after raw data) to create train/val/test.json.")
        er = model_dir / "eval_report.json"
        if er.exists():
            print("\n--- Colab/export metrics (eval_report.json) ---")
            print(er.read_text())
        return 0

    with open(test_path, encoding="utf-8") as f:
        test_data = json.load(f)
    if not isinstance(test_data, list):
        test_data = [test_data]

    n_sample = int(os.environ.get("EVAL_SAMPLE", "0"))
    if n_sample > 0:
        test_data = test_data[:n_sample]

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    model = AutoModelForTokenClassification.from_pretrained(str(model_dir))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    all_true: list[int] = []
    all_pred: list[int] = []
    for d in test_data:
        text = d.get("text") or ""
        spans = d.get("spans") or []
        true_ids, enc = spans_to_token_labels(text, spans, tokenizer, MAX_LENGTH)
        with torch.no_grad():
            logits = model(
                input_ids=torch.tensor([enc["input_ids"]], device=device),
                attention_mask=torch.tensor([enc["attention_mask"]], device=device),
            ).logits
        pred_ids = logits[0].argmax(-1).cpu().tolist()
        for i in range(len(true_ids)):
            if enc["attention_mask"][i] == 0:
                break
            all_true.append(true_ids[i])
            all_pred.append(pred_ids[i])

    acc = float(accuracy_score(all_true, all_pred))
    prec = float(precision_score(all_true, all_pred, average="weighted", zero_division=0))
    rec = float(recall_score(all_true, all_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(all_true, all_pred, average="weighted", zero_division=0))

    report = {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "n_test": len(test_data),
        "n_tokens_eval": len(all_true),
    }
    with open(report_out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("Local test evaluation (token-level, weighted):")
    print(json.dumps(report, indent=2))
    print("Written:", report_out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
