# ClinGuard: Model Training, Accuracy Testing, and Algorithm Review

This document records the **full process** of training the PHI model with **small datasets** (to avoid overwhelming the machine), **accuracy testing**, **before/after** and **findings**, **algorithm review** against the project docs and chapters, and **comparison** across different choices (with commands to reproduce and test).

**Related:** [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) (per-run tuning), [IMPLEMENTATION_RUN_LOG.md](IMPLEMENTATION_RUN_LOG.md) (pipeline), [PHI_Model_Training_Guide.md](PHI_Model_Training_Guide.md) (Colab guide).

---

## 1. Algorithm review: what the docs specify vs what we use

### 1.1 From your documentation

| Source | What is specified | Where |
|--------|-------------------|--------|
| **Chapter 4 (System Analysis and Design)** | PHI detection and redaction module; performance “evaluated against benchmarks (e.g. **F1 targets for PHI categories**)”; sub-200 ms latency for prompts up to 300 tokens. | docs/Chapter 4 System Analysis and Design.md |
| **PHI_Model_Training_Guide** | **Regex layer** (pattern-based PHI), **Entropy layer** (outlier/random tokens), **ML layer (Transformer)** for contextual PHI. **Measure accuracy, precision, recall, F1** for PHI detection. | docs/PHI_Model_Training_Guide.md |
| **Research / evaluation scope** | F1 ≥ 0.92 for direct identifiers, ≥ 0.85 for contextual PHI; detection accuracy on held-out test data. | docs/151535 IS FINAL SUBMISSION.docx.txt |

### 1.2 What we use (algorithms in code)

| Layer / algorithm | Where | Aligns with docs? |
|-------------------|--------|-------------------|
| **Regex** | `phi_detector.py`: PATTERNS for SSN, MRN, Kenya National ID (8-digit), EMAIL, PHONE, DATE, long numeric IDs. | Yes (pattern-based PHI). |
| **Entropy** | `phi_detector.py`: `_entropy()`, `_entropy_scan()` — Shannon entropy; high entropy → HIGH_ENTROPY (e.g. random IDs). | Yes (entropy layer). |
| **Transformer (NER)** | `train_phi_model.py`: BERT (or `BASE_MODEL`) token classification; BIO labels O, B-PHI, I-PHI. `phi_detector.py` loads from `phi_model/` when `USE_ML=1`. | Yes (ML layer). |
| **Metrics** | **Accuracy, precision, recall, F1** (binary PHI vs O) — in `train_phi_model.py` via `compute_metrics` and in `scripts/evaluate_phi_model.py` on test set. | Yes (per PHI_Model_Training_Guide and Chapter 4). |

**Conclusion:** The implementation matches the docs: hybrid (regex + entropy + Transformer), with accuracy/precision/recall/F1 as the evaluation metrics. No other algorithm was specified in the chapters; the ones used are appropriate for PHI detection and are kept track of here.

---

## 2. Small-dataset training (to avoid long runs)

To avoid overwhelming the machine and long training times, training can use **subsets** of the cleaned data via environment variables:

| Variable | Meaning | Example |
|----------|---------|--------|
| `TRAIN_SAMPLE` | Max number of training examples (0 = use all). | `500` |
| `VAL_SAMPLE` | Max number of validation examples (0 = use all). | `200` |
| `PHI_EPOCHS` | Number of epochs. | `1` for quick run, `2` for better convergence |

**Commands (run from `detection_engine/` with venv active):**

```powershell
# Small data: 500 train, 200 val, 1 epoch (fast)
$env:TRAIN_SAMPLE="500"; $env:VAL_SAMPLE="200"; $env:PHI_EPOCHS="1"
python train_phi_model.py

# Slightly larger, 2 epochs
$env:TRAIN_SAMPLE="1500"; $env:VAL_SAMPLE="400"; $env:PHI_EPOCHS="2"
python train_phi_model.py
```

Training now reports **accuracy, precision, recall, F1** at each evaluation (in addition to eval_loss), as required by the docs.

---

## 3. Accuracy testing and evaluation

### 3.1 Evaluate on test set

After training (or with an existing model), run the evaluation script to get **accuracy, precision, recall, F1** on the test set:

```powershell
cd detection_engine
.\venv\Scripts\Activate.ps1

# Evaluate on full test set (or omit EVAL_SAMPLE)
python scripts/evaluate_phi_model.py

# Evaluate on a subset (e.g. 300 examples) for speed
$env:EVAL_SAMPLE="300"
python scripts/evaluate_phi_model.py
```

The script writes **`phi_model/eval_report.json`** with: `accuracy`, `precision`, `recall`, `f1`, `n_test`, `n_tokens_eval`.

### 3.2 Before/after and findings (recorded run)

**Before (data):**

- Cleaned data from [data/cleaned/stats.json](../detection_engine/data/cleaned/stats.json): train 8,725, val 1,869, test 1,871 (after English-only filter).
- For small-data training: 500 train, 200 val (via `TRAIN_SAMPLE`, `VAL_SAMPLE`).

**After (evaluation on existing model, 300 test samples):**

| Metric | Value |
|--------|--------|
| Accuracy | 0.6788 |
| Precision | 0.5320 |
| Recall | 0.4219 |
| F1 | 0.4706 |
| n_test | 300 |
| n_tokens_eval | 14,478 |

**Findings:**

- Current model (BERT, previously trained on full/filtered data) on this test sample: **F1 ≈ 0.47**, accuracy ≈ 0.68. Recall is lower than precision (many PHI tokens missed).
- Per research targets (F1 ≥ 0.92 direct, ≥ 0.85 contextual), there is room for improvement by: more/better data, more epochs, or combining with regex/entropy (hybrid already in `phi_detector.py`).
- Keeping **before/after** and **findings** here and in `eval_report.json` keeps the process auditable.

---

## 4. Trying other options and tracking differences

To compare approaches and choose the best (or combine two), use the same metrics and same test set.

### 4.1 Options to try

| Option | What to do | Command / note |
|--------|------------|----------------|
| **Fewer epochs (faster)** | 1 epoch, small data. | `$env:PHI_EPOCHS="1"; $env:TRAIN_SAMPLE="500"; python train_phi_model.py` |
| **More epochs** | 2–3 epochs. | `$env:PHI_EPOCHS="2"` (or `3`) |
| **Different base model** | Lighter/faster model. | `$env:BASE_MODEL="distilbert-base-uncased"; python train_phi_model.py` (per PHI_Model_Training_Guide). |
| **Regex-only baseline** | No ML; use only `phi_detector` with `USE_ML=0`. | Compare detection output vs gold spans on a few examples; document precision/recall manually or with a small script. |
| **Hybrid (current)** | Regex + entropy + ML. | Default `phi_detector.py` with `USE_ML=1` and trained `phi_model/`. |

### 4.2 Comparison table (fill after each run)

| Run | Data (train/val) | Base model | Epochs | Accuracy | Precision | Recall | F1 | Notes |
|-----|------------------|------------|--------|----------|------------|--------|-----|--------|
| Baseline (existing) | 8,725 / 1,869 (full) | bert-base-uncased | 2 | 0.6788 | 0.5320 | 0.4219 | 0.4706 | Eval on 300 test samples. |
| (Your next run) | 500 / 200 | bert-base-uncased | 1 | — | — | — | — | Small data, 1 epoch. |
| (Optional) | 500 / 200 | distilbert-base-uncased | 1 | — | — | — | — | Lighter model. |

After each run: run `python scripts/evaluate_phi_model.py` (with or without `EVAL_SAMPLE`), then copy from `phi_model/eval_report.json` into this table so **differences and accuracy are tracked** over time.

### 4.3 Best or combined approach

- **Best single model:** Choose the run with highest F1 (and acceptable recall) for your use case.
- **Combined:** The pipeline already **combines** regex + entropy + ML in `phi_detector.py`. For even better coverage you can: (1) add more regex patterns (e.g. for Kenya IDs), or (2) use the best-performing transformer (e.g. BERT vs DistilBERT) and keep regex/entropy as fallback for known patterns. Document the chosen combo in this section after you decide.

---

## 5. Commands to test (quick reference)

Run from project root or from `detection_engine/`; if from root, prefix paths as needed.

```powershell
# 1. Activate venv
cd C:\Users\USER\Projects\clinguard-ai-shield\detection_engine
.\venv\Scripts\Activate.ps1

# 2. Train with small data (500 train, 200 val, 1 epoch)
$env:TRAIN_SAMPLE="500"; $env:VAL_SAMPLE="200"; $env:PHI_EPOCHS="1"
python train_phi_model.py

# 3. Evaluate accuracy (on test set; optional subset)
$env:EVAL_SAMPLE="300"   # optional: limit test size
python scripts/evaluate_phi_model.py

# 4. View saved report
# Open detection_engine/phi_model/eval_report.json

# 5. (Optional) Train with DistilBERT and compare
$env:BASE_MODEL="distilbert-base-uncased"; $env:TRAIN_SAMPLE="500"; $env:VAL_SAMPLE="200"; $env:PHI_EPOCHS="1"
python train_phi_model.py
# Then run step 3 again and compare F1 in the table above.
```

---

## 6. Where metrics and reports are stored

| What | Where |
|------|--------|
| Eval report (accuracy, precision, recall, F1) | `detection_engine/phi_model/eval_report.json` |
| Training metrics (eval_loss, etc.) | `detection_engine/phi_model/trainer_state.json` or `phi_model/checkpoint-*/trainer_state.json` |
| Cleaned data stats (before/after cleanup) | `detection_engine/data/cleaned/stats.json` |
| Per-run tuning log | [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) |

Keeping these files and this log updated ensures the **full process**, **before/after**, **findings**, and **model accuracy** are tracked and reproducible.
