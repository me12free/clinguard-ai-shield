"""
Evaluate the trained PHI model on test data. Reports accuracy, precision, recall, F1 (per Chapter 4 and PHI_Model_Training_Guide).
Usage (from detection_engine/ with venv active):
  python scripts/evaluate_phi_model.py
  PHI_MODEL_PATH=./phi_model PHI_DATA_DIR=./data/cleaned EVAL_SAMPLE=500 python scripts/evaluate_phi_model.py
"""
import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DETECTION_ENGINE_ROOT = SCRIPT_DIR.parent
if str(DETECTION_ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(DETECTION_ENGINE_ROOT))
DEFAULT_DATA_DIR = DETECTION_ENGINE_ROOT / "data" / "cleaned"
DEFAULT_MODEL_DIR = DETECTION_ENGINE_ROOT / "phi_model"
MAX_LENGTH = 128
IGNORE_LABEL_ID = -100


def main():
    data_dir = Path(os.environ.get("PHI_DATA_DIR", str(DEFAULT_DATA_DIR)))
    model_dir = Path(os.environ.get("PHI_MODEL_PATH", str(DEFAULT_MODEL_DIR)))
    test_path = data_dir / "test.json"
    if not test_path.exists():
        print("No test.json at", test_path, "- run clean_phi_data.py first.")
        sys.exit(1)
    if not (model_dir / "config.json").exists():
        print("No config.json at", model_dir, "- run train_phi_model.py first.")
        sys.exit(1)

    from transformers import AutoModelForTokenClassification, AutoTokenizer
    import torch
    from sklearn.metrics import precision_recall_fscore_support, accuracy_score

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    model = AutoModelForTokenClassification.from_pretrained(str(model_dir))
    model.eval()

    with open(model_dir / "label_map.json", "r", encoding="utf-8") as f:
        label_map = json.load(f)
    id2label = {int(k): v for k, v in label_map["id2label"].items()}

    with open(test_path, "r", encoding="utf-8") as f:
        test_data = json.load(f)
    if not isinstance(test_data, list):
        test_data = [test_data]
    eval_sample = int(os.environ.get("EVAL_SAMPLE", "0")) or None
    if eval_sample and len(test_data) > eval_sample:
        import random
        random.seed(44)
        test_data = random.sample(test_data, eval_sample)
    print(f"Evaluating on {len(test_data)} test examples")

    # Reuse label construction from train_phi_model
    from train_phi_model import spans_to_token_labels, LABEL2ID
    all_preds = []
    all_labels = []
    for d in test_data:
        text = d.get("text", "")
        spans = d.get("spans", [])
        label_ids, enc = spans_to_token_labels(text, spans, tokenizer, MAX_LENGTH)
        attention_mask = enc["attention_mask"]
        for j in range(len(attention_mask)):
            if attention_mask[j] == 0:
                label_ids[j] = IGNORE_LABEL_ID
        with torch.no_grad():
            inputs = {k: torch.tensor([v], device=model.device) for k, v in enc.items() if k in ("input_ids", "attention_mask")}
            out = model(**inputs)
            pred_ids = out.logits.argmax(dim=-1).squeeze(0).cpu().tolist()
        all_preds.extend(pred_ids)
        all_labels.extend(label_ids)

    preds_flat = [p for p, l in zip(all_preds, all_labels) if l != IGNORE_LABEL_ID]
    labels_flat = [l for l in all_labels if l != IGNORE_LABEL_ID]
    if not labels_flat:
        print("No valid labels.")
        sys.exit(1)
    acc = accuracy_score(labels_flat, preds_flat)
    y_true_bin = [1 if l != 0 else 0 for l in labels_flat]
    y_pred_bin = [1 if p != 0 else 0 for p in preds_flat]
    p, r, f1, _ = precision_recall_fscore_support(y_true_bin, y_pred_bin, average="binary", zero_division=0)
    report = {
        "accuracy": float(acc),
        "precision": float(p),
        "recall": float(r),
        "f1": float(f1),
        "n_test": len(test_data),
        "n_tokens_eval": len(labels_flat),
    }
    print("Evaluation report:")
    print(f"  accuracy:  {report['accuracy']:.4f}")
    print(f"  precision: {report['precision']:.4f}")
    print(f"  recall:    {report['recall']:.4f}")
    print(f"  F1:        {report['f1']:.4f}")
    out_report = model_dir / "eval_report.json"
    with open(out_report, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print("Report saved to", out_report)


if __name__ == "__main__":
    main()
