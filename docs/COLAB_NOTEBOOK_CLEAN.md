# ClinGuard PHI Model – Clean Colab Notebook (Step-by-Step)

Use this as your Colab notebook: copy each **Markdown** block into a **Text** cell and each **Code** block into a **Code** cell in order. I run everything on Colab so I don’t need to upload data or models from my PC. I only download the final zips and the summary chart at the end.

**Before you start:** Open [Colab](https://colab.research.google.com/), create a new notebook, and set **Runtime → Change runtime type → Hardware accelerator: T4 GPU**.

---

## 1. Clone repo and go to detection_engine

I clone my repo so I have the scripts (acquire, clean, train, evaluate, EDA). If the folder is already there (e.g. I’m re-running the notebook), I pull the latest so I use the current code. I always end in `detection_engine` so all paths below work.

**Pipeline (overview):**  
`[GitHub] → clone/pull → detection_engine/ (scripts + data/)`

```python
# --- Cell 1: Clone repo and enter detection_engine ---
import os
repo_name = "clinguard-ai-shield"
if os.path.isdir(repo_name):
  # Already cloned: pull latest and go to detection_engine
  %cd clinguard-ai-shield
  !git pull
  %cd detection_engine
else:
  # First run: clone from GitHub then enter detection_engine (all scripts run from here)
  !git clone https://github.com/me12free/clinguard-ai-shield.git
  %cd clinguard-ai-shield/detection_engine
```

---

## 2. Install dependencies

I install everything I need for data download, cleanup, training, evaluation, EDA, and the ML summary charts. I keep the list minimal so the runtime stays fast.

```python
# --- Cell 2: Install dependencies ---
# transformers/torch: model training; datasets: HF data; sklearn: metrics; langdetect: cleanup; matplotlib: EDA/training charts
!pip install -q transformers datasets accelerate scikit-learn torch langdetect matplotlib
```

---

## 3. Check GPU

I confirm the runtime is using a GPU so training is fast. If this prints `False`, I go to Runtime → Change runtime type and set GPU again.

```python
# --- Cell 3: Check GPU ---
# Training is much faster with GPU. If False, set Runtime → Change runtime type → T4 GPU
import torch
print("GPU available:", torch.cuda.is_available())
if torch.cuda.is_available():
  print("Device:", torch.cuda.get_device_name(0))
```

---

## 4. Step 1 – Data collection (acquire raw data)

I run the acquisition script so I have raw data from two sources: (1) synthetic PHI (Kenya-aligned names, IDs, MRN, SSN, dates, emails, phones) and (2) public PII from Hugging Face (pii-masking-65k). Everything is written under `data/raw/`. I set `PHI_SYNTHETIC_COUNT` to control how many synthetic examples are generated (default 2000).

**Diagram – Step 1 (Data collection):**  
`Synthetic generation → data/raw/synthetic_phi.jsonl`  
`Hugging Face (pii-masking-65k) → data/raw/pii_masking_65k/*.jsonl`

```python
# --- Cell 4: Step 1 – Data collection (acquire raw data) ---
import os
# Ensure we're in detection_engine (needed if you run this cell alone or after runtime restart)
if not os.path.isfile("scripts/acquire_datasets.py"):
  if os.path.isdir("clinguard-ai-shield"):
    %cd clinguard-ai-shield/detection_engine
  else:
    raise SystemExit("Run Cell 1 first to clone the repo.")
# How many synthetic PHI examples to generate (optional; default in script is 2000)
os.environ["PHI_SYNTHETIC_COUNT"] = "2000"
# Downloads Hugging Face pii-masking-65k and writes synthetic_phi.jsonl to data/raw/
!python scripts/acquire_datasets.py
# Quick check: list raw dir and line count of synthetic file
!ls -la data/raw/
!wc -l data/raw/synthetic_phi.jsonl 2>/dev/null || true
!ls data/raw/pii_masking_65k/ 2>/dev/null || true
```

---

## 5. Step 2 – EDA on raw data (insights + diagrams)

I run EDA on the raw data so I can see record counts, label distribution, text length stats, and sample snippets per category. I set `PHI_EDA_OUT=1` so the script writes `data/raw/eda_insights.json`. Then I plot the label distribution and text length distribution for my report (Chapter 5).

**Diagram – Step 2 (EDA):**  
`data/raw/*.jsonl → eda_phi_data.py → insights (counts, distribution, length) + eda_insights.json`

```python
# --- Cell 5: Step 2 – EDA on raw data ---
import os
# Point EDA script at raw data; PHI_EDA_OUT=1 writes data/raw/eda_insights.json
os.environ["PHI_DATA_DIR"] = "data/raw"
os.environ["PHI_EDA_OUT"] = "1"
# Prints: record count, label distribution, text length min/max/mean, sample per category
!python scripts/eda_phi_data.py
```

---

## 6. EDA diagrams – label distribution and text length (raw)

I load the EDA insights and plot two figures: (1) bar chart of span counts per PHI category and (2) histogram of text length (characters) from the raw data. I use these for Chapter 5 and for interpreting the dataset before cleanup.

```python
# --- Cell 6: EDA diagrams – label distribution + text length (raw) ---
import json
import matplotlib.pyplot as plt
from pathlib import Path
# Resolve data dir (works from detection_engine or repo root)
root = Path(".").resolve()
data_dir = root / "data" / "raw" if (root / "data" / "raw").exists() else root / "detection_engine" / "data" / "raw"
insights_path = data_dir / "eda_insights.json"
lengths = []
# Build list of text lengths from raw JSONL (cap at 5000 for speed)
for p in [data_dir / "synthetic_phi.jsonl"] + (list((data_dir / "pii_masking_65k").glob("*.jsonl")) if (data_dir / "pii_masking_65k").exists() else []):
  if not p.exists(): continue
  with open(p, "r", encoding="utf-8-sig") as f:
    for line in f:
      line = line.strip()
      if not line: continue
      try:
        rec = json.loads(line)
        text = (rec.get("text") or rec.get("content") or "")
        if isinstance(text, list): text = text[0] if text else ""
        lengths.append(len(str(text).strip()))
      except json.JSONDecodeError: pass
      if len(lengths) >= 5000: break
  if len(lengths) >= 5000: break
# Plot: (1) label distribution from eda_insights.json, (2) text length histogram
if insights_path.exists() or lengths:
  fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
  if insights_path.exists():
    with open(insights_path) as f:
      insights = json.load(f)
    dist = insights.get("label_distribution", {})
    if dist:
      cats = list(dist.keys())
      counts = list(dist.values())
      ax1.bar(range(len(cats)), counts, color="steelblue", edgecolor="black")
      ax1.set_xticks(range(len(cats)))
      ax1.set_xticklabels(cats, rotation=45, ha="right")
      ax1.set_ylabel("Span count")
      ax1.set_title("Raw data: label distribution (Step 2 EDA)")
  if lengths:
    ax2.hist(lengths, bins=50, color="steelblue", edgecolor="black")
    ax2.axvline(sum(lengths)/len(lengths), color="red", linestyle="--", label=f"Mean = {sum(lengths)/len(lengths):.0f}")
    ax2.set_xlabel("Text length (characters)")
    ax2.set_ylabel("Frequency")
    ax2.set_title("Raw data: text length distribution")
    ax2.legend()
  plt.tight_layout()
  plt.show()
else:
  print("Run the EDA cell above first so eda_insights.json exists and data/raw has JSONL.")
```

---

## 7. Step 3 – Data cleaning (merge, filter, dedup, split)

I run the cleanup script so all raw data is merged, normalized, filtered to English only (for my ClinGuard context), deduplicated, and split 70% train / 15% val / 15% test. The script writes `data/cleaned/train.json`, `val.json`, `test.json`, and `stats.json`. I keep English only because my project targets English clinical text (Kenya context).

**Diagram – Step 3 (Cleanup):**  
`data/raw/*.jsonl → clean_phi_data.py → normalize → filter language → dedup → split → data/cleaned/train.json, val.json, test.json, stats.json`

```python
# --- Cell 7: Step 3 – Data cleaning ---
# Merge all raw JSONL, normalize, keep English only, deduplicate, 70/15/15 train/val/test → data/cleaned/
!python scripts/clean_phi_data.py
```

---

## 8. Cleanup insights – read stats and show before/after

I read the stats file the cleanup script wrote so I can record before/after counts and the train/val/test split. This is the main insight from Step 3 for my report.

```python
# --- Cell 8: Cleanup insights – read stats from Step 3 ---
import os
import json
# Ensure we're in detection_engine so data/cleaned/ is found
if not os.path.isfile("data/cleaned/stats.json") and os.path.isdir("clinguard-ai-shield"):
  os.chdir("clinguard-ai-shield/detection_engine")
stats_path = "data/cleaned/stats.json"
if not os.path.isfile(stats_path):
  raise SystemExit("Run Cell 7 first (clean_phi_data.py) to create data/cleaned/stats.json.")
with open(stats_path) as f:
  stats = json.load(f)
print("=== Cleanup insights (Step 3) ===")
print("Total records read (before):", stats.get("before_count"))
print("Dropped (invalid):", stats.get("dropped_invalid"))
print("Dropped (non-English):", stats.get("dropped_language"))
print("After dedup:", stats.get("after_dedup"))
print("Train / Val / Test:", stats.get("train"), "/", stats.get("val"), "/", stats.get("test"))
if "label_distribution" in stats:
  print("\nLabel distribution (cleaned):", stats["label_distribution"])
```

---

## 9. Step 2 (again) – EDA on cleaned data + diagrams

I run EDA on the cleaned data so I have the same kind of insights (counts, distribution, text length) after cleanup. I set `PHI_EDA_OUT=1` so `data/cleaned/eda_insights.json` is written. Then I can plot label distribution for the cleaned set.

**Diagram – EDA on cleaned:**  
`data/cleaned/train.json, val.json, test.json → eda_phi_data.py → insights + eda_insights.json`

```python
# --- Cell 9: EDA on cleaned data (post Step 3) ---
import os
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["PHI_EDA_OUT"] = "1"
# Same EDA script; reads train/val/test.json, writes data/cleaned/eda_insights.json
!python scripts/eda_phi_data.py
```

---

## 10. EDA diagrams – label distribution (cleaned)

I load the cleaned EDA insights and plot the label distribution (bar chart) for the cleaned dataset. I use this in Chapter 5 to describe the dataset after cleanup.

```python
# --- Cell 10: EDA diagram – label distribution (cleaned) ---
import json
import matplotlib.pyplot as plt
from pathlib import Path
root = Path(".").resolve()
data_dir = root / "data" / "cleaned"
if not data_dir.exists():
  data_dir = root / "detection_engine" / "data" / "cleaned"
insights_path = data_dir / "eda_insights.json"
if insights_path.exists():
  with open(insights_path) as f:
    insights = json.load(f)
  dist = insights.get("label_distribution", {})
  if dist:
    fig, ax = plt.subplots(figsize=(10, 4))
    cats = list(dist.keys())
    counts = list(dist.values())
    ax.bar(range(len(cats)), counts, color="seagreen", edgecolor="black")
    ax.set_xticks(range(len(cats)))
    ax.set_xticklabels(cats, rotation=45, ha="right")
    ax.set_ylabel("Span count")
    ax.set_title("Cleaned data: label distribution (post Step 3)")
    plt.tight_layout()
    plt.show()
else:
  print("Run the EDA on cleaned cell above first.")
```

---

## 11. Step 4 & 5 – Training (Run 1: BERT, 3 epochs)

I point the training script at the cleaned data and set where to save the model. I use a larger batch size because I have a GPU. This run uses the default base model (BERT) and 3 epochs. The model is saved to `/content/phi_model` so I can evaluate it next.

**Diagram – Training:**  
`data/cleaned/train.json, val.json → train_phi_model.py → tokenization, BIO labels → Trainer → /content/phi_model/`

```python
# --- Cell 11: Training Run 1 (BERT, 3 epochs) ---
import os
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["PHI_MODEL_PATH"] = "/content/phi_model"
os.environ["PHI_EPOCHS"] = "3"
os.environ["PHI_BATCH_SIZE"] = "16"
# Default base model is BERT; output saved to /content/phi_model/
%run train_phi_model.py
```

---

## 12. Evaluate Run 1

I evaluate the first model on the full test set (EVAL_SAMPLE=0) so I have F1, accuracy, precision, and recall to compare with Run 2 and Run 3. The report is saved to `/content/phi_model/eval_report.json`.

```python
# --- Cell 12: Evaluate Run 1 ---
import os
import json
os.environ["PHI_MODEL_PATH"] = "/content/phi_model"
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["EVAL_SAMPLE"] = "0"  # 0 = full test set
!python scripts/evaluate_phi_model.py
with open("/content/phi_model/eval_report.json") as f:
  r = json.load(f)
print("Run 1 (BERT 3 ep): F1 =", r.get("f1"), " Accuracy =", r.get("accuracy"))
```

---

## 13. Training Run 2 (BERT, 2 epochs)

I train a second model with the same base (BERT) but 2 epochs so I can compare the effect of fewer epochs. The model is saved to `/content/phi_model_run2`.

```python
# --- Cell 13: Training Run 2 (BERT, 2 epochs) ---
import os
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["PHI_MODEL_PATH"] = "/content/phi_model_run2"
os.environ["PHI_EPOCHS"] = "2"
os.environ["PHI_BATCH_SIZE"] = "16"
# Same BERT base, fewer epochs – to compare effect of training length
%run train_phi_model.py
```

---

## 14. Evaluate Run 2

I evaluate Run 2 on the same test set and print the metrics so I can compare with Run 1 and Run 3.

```python
# --- Cell 14: Evaluate Run 2 ---
import os
import json
os.environ["PHI_MODEL_PATH"] = "/content/phi_model_run2"
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["EVAL_SAMPLE"] = "0"
!python scripts/evaluate_phi_model.py
with open("/content/phi_model_run2/eval_report.json") as f:
  r = json.load(f)
print("Run 2 (BERT 2 ep): F1 =", r.get("f1"), " Accuracy =", r.get("accuracy"))
```

---

## 15. Training Run 3 (DistilBERT, 3 epochs)

I train a third model with a different base (DistilBERT) and 3 epochs so I can compare architecture and training length. The model is saved to `/content/phi_model_run3`.

```python
# --- Cell 15: Training Run 3 (DistilBERT, 3 epochs) ---
import os
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["PHI_MODEL_PATH"] = "/content/phi_model_run3"
os.environ["BASE_MODEL"] = "distilbert-base-uncased"
os.environ["PHI_EPOCHS"] = "3"
os.environ["PHI_BATCH_SIZE"] = "16"
# Different base model – to compare BERT vs DistilBERT
%run train_phi_model.py
```

---

## 16. Evaluate Run 3

I evaluate Run 3 on the same test set. After this I have three eval reports to rank by F1.

```python
# --- Cell 16: Evaluate Run 3 ---
import os
import json
os.environ["PHI_MODEL_PATH"] = "/content/phi_model_run3"
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["EVAL_SAMPLE"] = "0"
!python scripts/evaluate_phi_model.py
with open("/content/phi_model_run3/eval_report.json") as f:
  r = json.load(f)
print("Run 3 (DistilBERT 3 ep): F1 =", r.get("f1"), " Accuracy =", r.get("accuracy"))
```

---

## 17. Compare all three runs and copy top 2 by F1

I load the eval reports from all three runs, sort by F1 (descending), and copy the best two model directories to `/content/phi_model_rank1` and `/content/phi_model_rank2`. I use these for zipping and for the ML summary table and chart.

**Diagram – Compare & export:**  
`eval_report.json (run1, run2, run3) → rank by F1 → copy top 2 → phi_model_rank1, phi_model_rank2`

```python
# --- Cell 17: Compare runs by F1 and copy top 2 ---
import json
import os
import shutil
# All three run dirs and their labels
candidates = [
  ("/content/phi_model", "run1 (BERT 3ep)"),
  ("/content/phi_model_run2", "run2 (BERT 2ep)"),
  ("/content/phi_model_run3", "run3 (DistilBERT 3ep)"),
]
results = []
for model_dir, label in candidates:
  report_path = os.path.join(model_dir, "eval_report.json")
  if os.path.isfile(report_path):
    with open(report_path) as f:
      report = json.load(f)
    results.append((report.get("f1", 0), model_dir, label, report))
  else:
    results.append((-1, model_dir, label, None))
# Sort by F1 descending; take best two
results.sort(key=lambda x: -x[0])
top2 = results[:2]
for i, (f1, model_dir, label, _) in enumerate(top2, 1):
  dest = f"/content/phi_model_rank{i}"
  if os.path.isdir(dest):
    shutil.rmtree(dest)
  shutil.copytree(model_dir, dest)
  print(f"Rank {i}: {label} -> phi_model_rank{i} (F1={f1:.4f})")
print("Top 2 ready. Run the ML summary cell next, then zip/download.")
```

---

## 18. ML summary – table and chart for Chapter 5

I build a summary table of all runs (including rank1 and rank2) and draw a bar chart of F1 and accuracy so I can paste or screenshot them into my report (Chapter 5.4.1). I also save the summary as JSON for my records.

**Diagram – ML summary:**  
`eval_report.json (run1, run2, run3, rank1, rank2) → table + bar chart → phi_ml_summary.png, phi_ml_run_summary.json`

```python
# --- Cell 18: ML summary – table + chart for Chapter 5 ---
import os
import json
# Include all five: three runs plus rank1 (best) and rank2 (second best)
RUNS = [
  ("/content/phi_model", "Run 1 (BERT 3 ep)"),
  ("/content/phi_model_run2", "Run 2 (BERT 2 ep)"),
  ("/content/phi_model_run3", "Run 3 (DistilBERT 3 ep)"),
  ("/content/phi_model_rank1", "Rank 1 (best F1)"),
  ("/content/phi_model_rank2", "Rank 2 (second)"),
]
rows = []
for dir_path, label in RUNS:
  report_path = os.path.join(dir_path, "eval_report.json")
  if os.path.isfile(report_path):
    with open(report_path) as f:
      r = json.load(f)
    rows.append({"run": label, "f1": r.get("f1", 0), "accuracy": r.get("accuracy", 0),
                 "precision": r.get("precision", 0), "recall": r.get("recall", 0), "n_test": r.get("n_test", 0)})
if not rows:
  print("Run the compare cell first so eval_report.json exists for each run.")
else:
  # Print table for copy/paste or screenshot into report
  print("=== ML run summary for Chapter 5 ===\n")
  print(f"{'Run':<28} {'F1':>8} {'Accuracy':>10} {'Precision':>10} {'Recall':>8} {'n_test':>8}")
  print("-" * 76)
  for row in rows:
    print(f"{row['run']:<28} {row['f1']:>8.4f} {row['accuracy']:>10.4f} {row['precision']:>10.4f} {row['recall']:>8.4f} {row['n_test']:>8}")
  print()
  # Bar chart: F1 and Accuracy per run (for Chapter 5.4.1 figures)
  import matplotlib.pyplot as plt
  import numpy as np
  labels = [r["run"] for r in rows]
  f1_vals = [r["f1"] for r in rows]
  acc_vals = [r["accuracy"] for r in rows]
  x = np.arange(len(labels))
  width = 0.35
  fig, ax = plt.subplots(figsize=(10, 5))
  ax.bar(x - width/2, f1_vals, width, label="F1")
  ax.bar(x + width/2, acc_vals, width, label="Accuracy")
  ax.set_ylabel("Score")
  ax.set_title("PHI model runs: F1 and Accuracy (Chapter 5.4.1)")
  ax.set_xticks(x)
  ax.set_xticklabels(labels, rotation=15, ha="right")
  ax.legend()
  ax.set_ylim(0, 1.05)
  fig.tight_layout()
  plt.savefig("/content/phi_ml_summary.png", dpi=150, bbox_inches="tight")
  plt.show()
  with open("/content/phi_ml_run_summary.json", "w") as f:
    json.dump(rows, f, indent=2)
  print("Chart saved to /content/phi_ml_summary.png. Summary JSON: /content/phi_ml_run_summary.json")
```

---

## 19. Zip top 2 models and download (one archive)

I zip both phi_model_rank1 and phi_model_rank2 into one archive and download it so I have a single file with the best two models. On my PC I unzip and put rank1 into `detection_engine/phi_model/`.

```python
# --- Cell 19: Zip top 2 models and download (one archive) ---
import os
import subprocess
from google.colab import files
zip_dirs = [d for d in ["/content/phi_model_rank1", "/content/phi_model_rank2"] if os.path.isdir(d)]
if not zip_dirs:
  print("Run the compare cell first.")
else:
  subprocess.run(["zip", "-r", "/content/phi_model_top2.zip"] + zip_dirs, check=True)
  files.download("/content/phi_model_top2.zip")
# On PC: unzip and put phi_model_rank1 contents into detection_engine/phi_model/
```

---

## 20. (Optional) Zip each model separately

If I want to download each model in its own zip (e.g. only rank1, or all five), I run this. Each existing model dir is zipped to `/content/<name>.zip` and then downloaded. Colab may prompt for each download.

```python
# --- Cell 20 (optional): Zip each model separately and download ---
# Use this if you want one zip per model (e.g. only rank1, or all five). Colab may prompt per file.
import os
import subprocess
from google.colab import files
model_dirs = [
  ("/content/phi_model", "phi_model"),
  ("/content/phi_model_run2", "phi_model_run2"),
  ("/content/phi_model_run3", "phi_model_run3"),
  ("/content/phi_model_rank1", "phi_model_rank1"),
  ("/content/phi_model_rank2", "phi_model_rank2"),
]
for dir_path, name in model_dirs:
  if os.path.isdir(dir_path):
    zip_path = f"/content/{name}.zip"
    subprocess.run(["zip", "-r", zip_path, dir_path], check=True)
    print("Created", zip_path)
    files.download(zip_path)
```

---

## 21. (Optional) Download the ML summary chart

I download the F1/Accuracy bar chart image so I can insert it into my Chapter 5 report.

```python
# --- Cell 21 (optional): Download the ML summary chart ---
# F1/Accuracy bar chart for Chapter 5.4.1 (run after cell 18)
from google.colab import files
files.download("/content/phi_ml_summary.png")
```

---

## Quick reference – cell order

| # | What I do |
|---|-----------|
| 1 | Clone/pull repo, cd to detection_engine |
| 2 | pip install (transformers, torch, sklearn, langdetect, matplotlib) |
| 3 | Check GPU |
| 4 | Acquire raw data (synthetic + Hugging Face) |
| 5 | EDA on raw (insights + eda_insights.json) |
| 6 | EDA diagrams: label dist + text length (raw) |
| 7 | Cleanup (merge, English filter, dedup, 70/15/15 split) |
| 8 | Read stats.json (cleanup insights) |
| 9 | EDA on cleaned |
| 10 | EDA diagrams: label dist (cleaned) |
| 11 | Train Run 1 (BERT 3 ep) → /content/phi_model |
| 12 | Evaluate Run 1 |
| 13 | Train Run 2 (BERT 2 ep) → /content/phi_model_run2 |
| 14 | Evaluate Run 2 |
| 15 | Train Run 3 (DistilBERT 3 ep) → /content/phi_model_run3 |
| 16 | Evaluate Run 3 |
| 17 | Compare by F1, copy top 2 to rank1, rank2 |
| 18 | ML summary table + chart, save JSON |
| 19 | Zip top 2 → download |
| 20 | (Optional) Zip each model separately → download |
| 21 | (Optional) Download phi_ml_summary.png |
