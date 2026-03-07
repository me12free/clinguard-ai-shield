"""
Train or fine-tune a PHI NER model. Saves to ./phi_model/ (or PHI_MODEL_PATH).
Usage (from detection_engine/ with venv active):
  pip install -r requirements.txt
  python train_phi_model.py

Uses cleaned data from data/cleaned/ (see docs/DATASET_CLEANUP.md) or falls back to synthetic data.
For production use MIMIC/i2b2 (see docs/PHI_Model_Training_Guide.md).
"""
import json
import os
from pathlib import Path

# Project paths
DETECTION_ENGINE_ROOT = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = DETECTION_ENGINE_ROOT / "data" / "cleaned"
DEFAULT_MODEL_DIR = DETECTION_ENGINE_ROOT / "phi_model"
MAX_LENGTH = 128
LABEL2ID = {"O": 0, "B-PHI": 1, "I-PHI": 2}
ID2LABEL = {v: k for k, v in LABEL2ID.items()}


def get_synthetic_data():
    """Generate minimal synthetic PHI examples when no cleaned data exists."""
    texts = [
        "Patient John Doe MRN 123456 presented with fever.",
        "Contact: jane@hospital.org or 555-123-4567.",
        "DOB 1990-01-15. SSN 123-45-6789.",
    ]
    # Simple span-style; we convert to token labels in tokenize_and_align_labels
    spans_list = [
        [{"start": 8, "end": 16, "category": "NAME"}, {"start": 20, "end": 26, "category": "MRN"}],
        [{"start": 10, "end": 26, "category": "EMAIL"}, {"start": 30, "end": 42, "category": "PHONE"}],
        [{"start": 4, "end": 14, "category": "DATE"}, {"start": 17, "end": 28, "category": "SSN"}],
    ]
    return [{"text": t, "spans": s} for t, s in zip(texts, spans_list)]


def load_cleaned_data(data_dir: Path, train_sample: int | None = None, val_sample: int | None = None):
    """Load train/val from data_dir. Optionally cap sizes with train_sample/val_sample for fast runs."""
    train_path = data_dir / "train.json"
    val_path = data_dir / "val.json"
    if not train_path.exists():
        return None, None
    with open(train_path, "r", encoding="utf-8") as f:
        train_data = json.load(f) if train_path.suffix == ".json" else [json.loads(line) for line in f]
    if not isinstance(train_data, list):
        train_data = [train_data]
    if train_sample is not None and train_sample > 0 and len(train_data) > train_sample:
        import random
        random.seed(42)
        train_data = random.sample(train_data, train_sample)
    val_data = None
    if val_path.exists():
        with open(val_path, "r", encoding="utf-8") as f:
            val_data = json.load(f) if val_path.suffix == ".json" else [json.loads(line) for line in f]
        if not isinstance(val_data, list):
            val_data = [val_data]
        if val_sample is not None and val_sample > 0 and len(val_data) > val_sample:
            import random
            random.seed(43)
            val_data = random.sample(val_data, val_sample)
    return train_data, val_data


def spans_to_token_labels(text: str, spans: list, tokenizer, max_length: int):
    """Convert character spans to token-level label ids (BIO)."""
    if not spans:
        enc = tokenizer(text, truncation=True, max_length=max_length, return_offsets_mapping=True)
        return [LABEL2ID["O"]] * len(enc["input_ids"]), enc
    # Build char-level labels: 0 = O, 1 = B-PHI, 2 = I-PHI (simplified)
    char_labels = [0] * len(text)
    for s in spans:
        start = s.get("start", 0)
        end = s.get("end", start)
        for i in range(start, min(end, len(text))):
            char_labels[i] = 2 if i > start and char_labels[i - 1] in (1, 2) else 1
    enc = tokenizer(
        text,
        truncation=True,
        max_length=max_length,
        padding="max_length",
        return_offsets_mapping=True,
        return_tensors=None,
    )
    label_ids = []
    for start, end in enc["offset_mapping"]:
        if start == 0 and end == 0:
            label_ids.append(LABEL2ID["O"])
            continue
        segment = char_labels[start:end]
        if not segment:
            label_ids.append(LABEL2ID["O"])
        else:
            label_ids.append(segment[0] if segment[0] != 0 else LABEL2ID["O"])
    return label_ids, enc


def main():
    import logging
    import warnings
    # Reduce verbose loading report and accelerator messages (expected when loading BERT for token classification)
    for _name in ("transformers", "transformers.modeling_utils", "accelerate", "accelerate.utils"):
        logging.getLogger(_name).setLevel(logging.ERROR)
    warnings.filterwarnings("ignore", message=".*pin_memory.*")
    os.environ.setdefault("ACCELERATE_DISABLE_RICH", "1")  # reduce accelerate stderr output
    try:
        from transformers import (
            AutoModelForTokenClassification,
            AutoTokenizer,
            Trainer,
            TrainingArguments,
        )
        from datasets import Dataset
    except ImportError:
        print("Install: pip install transformers datasets")
        return

    data_dir = Path(os.environ.get("PHI_DATA_DIR", str(DEFAULT_DATA_DIR)))
    out_dir = Path(os.environ.get("PHI_MODEL_PATH", str(DEFAULT_MODEL_DIR)))
    out_dir.mkdir(parents=True, exist_ok=True)

    model_name = os.environ.get("BASE_MODEL", "bert-base-uncased")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForTokenClassification.from_pretrained(
        model_name,
        num_labels=len(LABEL2ID),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )
    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cuda":
            print("Using GPU:", torch.cuda.get_device_name(0))
        else:
            print("Using CPU (install PyTorch with CUDA for faster training).")
    except Exception:
        pass

    train_sample = int(os.environ.get("TRAIN_SAMPLE", "0")) or None
    val_sample = int(os.environ.get("VAL_SAMPLE", "0")) or None
    train_data, val_data = load_cleaned_data(data_dir, train_sample=train_sample, val_sample=val_sample)
    if train_data is None:
        train_data = get_synthetic_data()
        val_data = []
        print("Using synthetic data (no cleaned data found). See docs/DATASET_CLEANUP.md.")
    else:
        if train_sample:
            print(f"Using subset: train={len(train_data)}, val={len(val_data) or 0} (TRAIN_SAMPLE={train_sample}, VAL_SAMPLE={val_sample})")

    def tokenize(examples):
        input_ids, attention_mask, labels = [], [], []
        texts = examples["text"] if isinstance(examples["text"], list) else [examples["text"]]
        spans_list = examples.get("spans", [[]])
        if not isinstance(spans_list[0], list):
            spans_list = [spans_list]
        for text, spans in zip(texts, spans_list):
            label_ids, enc = spans_to_token_labels(text, spans, tokenizer, MAX_LENGTH)
            input_ids.append(enc["input_ids"])
            attention_mask.append(enc["attention_mask"])
            labels.append(label_ids)
        return {"input_ids": input_ids, "attention_mask": attention_mask, "labels": labels}

    train_enc = tokenizer(
        [d["text"] for d in train_data],
        truncation=True,
        padding="max_length",
        max_length=MAX_LENGTH,
        return_tensors=None,
    )
    IGNORE_LABEL_ID = -100  # skip padding in loss and metrics
    # Build labels with padding set to IGNORE_LABEL_ID
    train_labels = []
    for i, d in enumerate(train_data):
        lbl, _ = spans_to_token_labels(d["text"], d.get("spans", []), tokenizer, MAX_LENGTH)
        am = train_enc["attention_mask"][i]
        for j in range(min(len(am), len(lbl))):
            if am[j] == 0:
                lbl[j] = IGNORE_LABEL_ID
        train_labels.append(lbl)

    train_dataset = Dataset.from_dict({
        "input_ids": train_enc["input_ids"],
        "attention_mask": train_enc["attention_mask"],
        "labels": train_labels,
    })

    eval_dataset = None
    if val_data:
        val_enc = tokenizer(
            [d["text"] for d in val_data],
            truncation=True,
            padding="max_length",
            max_length=MAX_LENGTH,
            return_tensors=None,
        )
        val_labels = []
        for i, d in enumerate(val_data):
            lbl, _ = spans_to_token_labels(d["text"], d.get("spans", []), tokenizer, MAX_LENGTH)
            am = val_enc["attention_mask"][i]
            for j in range(min(len(am), len(lbl))):
                if am[j] == 0:
                    lbl[j] = IGNORE_LABEL_ID
            val_labels.append(lbl)
        eval_dataset = Dataset.from_dict({
            "input_ids": val_enc["input_ids"],
            "attention_mask": val_enc["attention_mask"],
            "labels": val_labels,
        })

    def compute_metrics(eval_pred):
        """Token-level accuracy and PHI (B+I) precision, recall, F1 per docs (Chapter 4, PHI_Model_Training_Guide)."""
        from sklearn.metrics import precision_recall_fscore_support, accuracy_score
        preds, labels = eval_pred.predictions, eval_pred.label_ids
        if preds.ndim == 3:
            preds = preds.argmax(axis=-1)
        preds_flat = preds.flatten()
        labels_flat = labels.flatten()
        mask = labels_flat != IGNORE_LABEL_ID
        preds_flat = preds_flat[mask]
        labels_flat = labels_flat[mask]
        if len(labels_flat) == 0:
            return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1": 0.0}
        acc = accuracy_score(labels_flat, preds_flat)
        # Binary: PHI (1,2) vs O (0)
        y_true_bin = (labels_flat != 0).astype(int)
        y_pred_bin = (preds_flat != 0).astype(int)
        p, r, f1, _ = precision_recall_fscore_support(y_true_bin, y_pred_bin, average="binary", zero_division=0)
        return {"accuracy": float(acc), "precision": float(p), "recall": float(r), "f1": float(f1)}

    batch_size = int(os.environ.get("PHI_BATCH_SIZE", "0")) or 4
    training_args = TrainingArguments(
        output_dir=str(out_dir),
        num_train_epochs=int(os.environ.get("PHI_EPOCHS", "2")),
        per_device_train_batch_size=batch_size,
        eval_strategy="epoch" if eval_dataset else "no",
        save_strategy="epoch",
        save_total_limit=1,
        load_best_model_at_end=bool(os.environ.get("LOAD_BEST_AT_END", "0") == "1"),  # False avoids checkpoint key mismatch (gamma/beta vs weight/bias) on save/load
        dataloader_pin_memory=False,  # avoid warning when no GPU
        report_to="none",  # avoid extra stderr (PowerShell may treat progress as error)
    )
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        compute_metrics=compute_metrics if eval_dataset else None,
    )
    trainer.train()
    if eval_dataset:
        metrics = trainer.evaluate()
        print("Eval metrics:", metrics)
    model.save_pretrained(out_dir)
    tokenizer.save_pretrained(out_dir)
    # Save label mapping for inference
    with open(out_dir / "label_map.json", "w", encoding="utf-8") as f:
        json.dump({"label2id": LABEL2ID, "id2label": ID2LABEL}, f, indent=2)
    print("Model and tokenizer saved to", out_dir)
    print("Set PHI_MODEL_PATH or use default detection_engine/phi_model/ for inference (phi_detector.py).")


if __name__ == "__main__":
    main()
