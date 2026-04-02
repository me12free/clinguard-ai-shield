# ML Process: Dataset, Steps, Insights, and Diagrams (ClinGuard PHI Model)

This document describes the **end-to-end ML training process** from data collection to deployment, the **insights generated at each step**, and how they map to ClinGuard scripts, outputs, and diagrams. Use it for Chapter 5 (Implementation and Testing) and for running the Colab pipeline with insight collection.

---

## Standard ML Pipeline (from literature)

A typical ML pipeline has these stages:

1. **Data collection** – Gather raw data from sources.
2. **Exploratory Data Analysis (EDA)** – Understand structure, quality, and suitability.
3. **Data cleaning & preprocessing** – Fix quality issues, filter, deduplicate.
4. **Data preparation / feature engineering** – Transform into model-ready format (e.g. tokenization, labels).
5. **Model training** – Train the model on prepared data.
6. **Evaluation** – Measure performance on held-out data.
7. **Deployment** – Serve the model for inference.

Each step produces **artifacts** and **insights** that inform the next step and your report.

---

## Step 1: Data Collection

**What happens:** Raw data is gathered from one or more sources (APIs, files, synthetic generation).

**ClinGuard mapping:**

- **Script:** `scripts/acquire_datasets.py`
- **Sources:** (1) Synthetic data via in-repo generation (Kenya-aligned names, IDs, MRN, SSN, dates, emails, phones); (2) Public PII: Hugging Face `ai4privacy/pii-masking-65k` (and optionally 300k).
- **Output:** `data/raw/synthetic_phi.jsonl`, `data/raw/pii_masking_65k/*.jsonl`.

**Insights from this step:**

- Total number of raw records per source.
- Which sources succeeded (e.g. HF download OK vs failed).
- File sizes and paths for reproducibility.

**Diagram:** [ML_Process_Step1_Data_Collection.mmd](Diagrams/ML_Process_Step1_Data_Collection.mmd)

**Code:** Run in Colab: `!python scripts/acquire_datasets.py` then inspect `!ls -la data/raw/` and `!wc -l data/raw/*.jsonl`.

---

## Step 2: Exploratory Data Analysis (EDA)

**What happens:** Analyze the raw (and later cleaned) dataset: record counts, label distribution, text length, language mix, missing or invalid fields.

**ClinGuard mapping:**

- **Script:** `scripts/eda_phi_data.py` (run on `data/raw` or `data/cleaned`).
- **Output:** Printed summary and optional `data/cleaned/eda_insights.json` (or `data/raw/eda_insights.json` when run on raw).

**Insights from this step:**

- Record counts (raw vs cleaned if run on both).
- **Label distribution:** Counts per PHI category (NAME, MRN, SSN, EMAIL, PHONE, DATE, etc.).
- **Text length stats:** Min/max/mean length (chars or tokens) to decide max_length and truncation.
- **Samples:** Examples of categories for sanity checks.
- **Language mix (raw):** If EDA runs on raw data before language filter, you see how much non-English exists.

**Diagram:** [ML_Process_Step2_EDA.mmd](Diagrams/ML_Process_Step2_EDA.mmd)

**Code:** `PHI_DATA_DIR=data/raw python scripts/eda_phi_data.py` (raw) or `PHI_DATA_DIR=data/cleaned python scripts/eda_phi_data.py` (cleaned). See Colab section below for full pipeline.

---

## Step 3: Data Cleaning & Preprocessing

**What happens:** Normalize format, remove invalid records, filter by criteria (e.g. language), deduplicate, and split into train/validation/test.

**ClinGuard mapping:**

- **Script:** `scripts/clean_phi_data.py`
- **Input:** `data/raw/` (all JSONL).
- **Output:** `data/cleaned/train.json`, `val.json`, `test.json`, `stats.json`.

**Insights from this step (in `stats.json` and console):**

- **before_count:** Total raw records read.
- **dropped_invalid:** Records dropped due to invalid/missing text or spans.
- **dropped_language:** Records dropped by language filter (e.g. non-English).
- **after_dedup:** Record count after deduplication.
- **train / val / test:** Split sizes (70% / 15% / 15%).
- **label_distribution:** Per-category span counts in the cleaned set.
- **algorithms_used:** Text normalization, span validation, category mapping, language filter, dedup, split (for reproducibility).

**Diagram:** [ML_Process_Step3_Data_Cleaning.mmd](Diagrams/ML_Process_Step3_Data_Cleaning.mmd)

**Code:** `!python scripts/clean_phi_data.py` then `open("data/cleaned/stats.json")` and print its contents.

---

## Step 4: Data Preparation / Feature Engineering

**What happens:** Transform cleaned records into the format the model consumes: tokenization, alignment of labels to tokens (e.g. BIO), train/val dataloaders.

**ClinGuard mapping:**

- **Where:** Inside `train_phi_model.py` (and `evaluate_phi_model.py`): character spans → BIO token labels via `spans_to_token_labels`, tokenizer with `max_length=128`.
- **Categories:** NAME, MRN, SSN, EMAIL, PHONE, DATE, ID_NUMBER, KENYA_NATIONAL_ID, PHI, etc. → label_map (B/I/O or B-PHI, I-PHI, O).
- **No separate script:** Preparation is part of training/eval.

**Insights from this step:**

- **Label mapping:** `label_map.json` in the model dir (id2label, label2id).
- **Max length / truncation:** How many tokens per sequence; how many spans might be cut at boundaries (for interpretation of edge errors).

**Diagram:** [ML_Process_Step4_Data_Preparation.mmd](Diagrams/ML_Process_Step4_Data_Preparation.mmd)

**Code:** Inspect `phi_model/label_map.json` after training; in code, `train_phi_model.spans_to_token_labels` and tokenizer config show the preparation logic.

---

## Step 5: Model Training

**What happens:** Train the model (e.g. BERT or DistilBERT for token classification) on the training set, with validation evaluation each epoch if a val set is provided.

**ClinGuard mapping:**

- **Script:** `train_phi_model.py`
- **Env:** `PHI_DATA_DIR`, `PHI_MODEL_PATH`, `PHI_EPOCHS`, `PHI_BATCH_SIZE`, `BASE_MODEL`.
- **Output:** Model dir (config, tokenizer, weights, `label_map.json`); optional eval metrics per epoch on val set.

**Insights from this step:**

- **Eval metrics during training:** If val set is used, accuracy/precision/recall/F1 per epoch (printed by the Trainer).
- **Final save path:** Where the model is saved for evaluation and deployment.
- **Hyperparameters:** Epochs, batch size, base model name (for reporting and comparison of runs).

**Diagram:** [ML_Process_Step5_Model_Training.mmd](Diagrams/ML_Process_Step5_Model_Training.mmd)

**Code:** Set env vars then `%run train_phi_model.py`; optionally inspect `phi_model/trainer_state.json` for `log_history` (loss, eval metrics).

---

## Step 6: Evaluation

**What happens:** Run the trained model on the held-out test set and compute metrics (accuracy, precision, recall, F1).

**ClinGuard mapping:**

- **Script:** `scripts/evaluate_phi_model.py`
- **Input:** Model dir (`PHI_MODEL_PATH`), test set (`PHI_DATA_DIR/test.json`).
- **Output:** Console metrics and `eval_report.json` in the model dir (accuracy, precision, recall, f1, n_test, n_tokens_eval).

**Insights from this step:**

- **F1 / precision / recall:** Primary metrics for PHI detection (binary: PHI vs O at token level).
- **Accuracy:** Token-level accuracy.
- **n_test, n_tokens_eval:** Scale of evaluation for fair comparison across runs.
- **Comparison across runs:** Run evaluation for multiple model dirs (e.g. run1, run2, run3, rank1, rank2) and compare F1 to select the best model (see Colab “ML focus: run summary and charts” cell).

**Diagram:** [ML_Process_Step6_Evaluation.mmd](Diagrams/ML_Process_Step6_Evaluation.mmd)

**Code:** `PHI_MODEL_PATH=/content/phi_model PHI_DATA_DIR=data/cleaned EVAL_SAMPLE=0 !python scripts/evaluate_phi_model.py`; then load `eval_report.json` for tables and charts.

---

## Step 7: Deployment

**What happens:** The chosen model is packaged and used in production for inference (e.g. via an API or local loader).

**ClinGuard mapping:**

- **Component:** `phi_detector.py` loads the model from `phi_model/` (or `PHI_MODEL_PATH`) when `USE_ML=1` and `config.json` exists.
- **Usage:** Laravel backend calls the Python detection engine; the engine runs NER and returns spans; redaction and chat use those spans.
- **Export:** From Colab, zip the chosen model (e.g. phi_model_rank1) and place it in `detection_engine/phi_model/` on your machine.

**Insights from this step:**

- **Which model was deployed:** e.g. “phi_model_rank1 (best F1) as detection_engine/phi_model/”.
- **Runtime behavior:** Latency, GPU vs CPU, fallback to regex/entropy if the model fails to load.

**Diagram:** [ML_Process_Step7_Deployment.mmd](Diagrams/ML_Process_Step7_Deployment.mmd)

**Code:** No Colab code for deployment; on PC unzip the model into `detection_engine/phi_model/` and run the app.

---

## Summary: Insights per step

| Step | Main artifact | Insights you get |
|------|----------------|------------------|
| 1. Data collection | `data/raw/*.jsonl` | Raw counts, sources, file paths |
| 2. EDA | Console + optional `eda_insights.json` | Label distribution, text length stats, samples |
| 3. Data cleaning | `train/val/test.json`, `stats.json` | Before/after counts, drop reasons, split sizes, label distribution |
| 4. Data preparation | `label_map.json`, tokenizer config | Label mapping, max length, BIO scheme |
| 5. Training | Model dir, optional `trainer_state.json` | Epoch metrics, save path, hyperparameters |
| 6. Evaluation | `eval_report.json` | F1, precision, recall, accuracy, n_test |
| 7. Deployment | Model in `phi_model/` | Which model, runtime behavior |

---

## Diagrams index (per step)

All diagrams are in `docs/Diagrams/`. Render with [mermaid.live](https://mermaid.live) or VS Code Mermaid extension; export PNG/SVG for your report.

| Step | Diagram file | Purpose |
|------|----------------|--------|
| 1 | `ML_Process_Step1_Data_Collection.mmd` | Sources → raw files |
| 2 | `ML_Process_Step2_EDA.mmd` | Raw/cleaned → EDA → insights |
| 3 | `ML_Process_Step3_Data_Cleaning.mmd` | Raw → clean → train/val/test + stats |
| 4 | `ML_Process_Step4_Data_Preparation.mmd` | Cleaned → tokenization → BIO labels |
| 5 | `ML_Process_Step5_Model_Training.mmd` | Train/val → training loop → model artifacts |
| 6 | `ML_Process_Step6_Evaluation.mmd` | Model + test set → metrics → report |
| 7 | `ML_Process_Step7_Deployment.mmd` | Model → inference API / phi_detector |

A single end-to-end view is in `PHI Training Pipeline.mmd` and `Dataset Flow Diagram.mmd`.

---

## Code: Running the full ML pipeline and collecting insights (Colab)

See **[COLAB_FULL_GUIDE.md](COLAB_FULL_GUIDE.md)** for the full notebook. The following adds an **“ML process: run all steps and collect insights”** block you can paste after your setup (clone, install, GPU check). It runs the pipeline in order and prints insights at each step.

1. **Acquire** → print raw file list and line counts.
2. **EDA on raw** → run `eda_phi_data.py` on `data/raw`, print insights.
3. **Clean** → run `clean_phi_data.py`, load and print `stats.json`.
4. **EDA on cleaned** → run `eda_phi_data.py` on `data/cleaned`, print insights (optional).
5. **Train** (Run 1) → run `train_phi_model.py`, note save path.
6. **Evaluate** → run `evaluate_phi_model.py`, load and print `eval_report.json`.
7. (Repeat for Run 2 and Run 3 if desired; then compare and run “ML focus: run summary and charts” for the table and F1/accuracy chart.)

The exact Colab cells are in the section **“ML process: run pipeline and collect insights at each step”** in COLAB_FULL_GUIDE.md (added below). Use the printed output and saved JSON files (stats.json, eda_insights.json, eval_report.json) for your Chapter 5 narrative and interpretation.
