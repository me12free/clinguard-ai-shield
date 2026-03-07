# ClinGuard: Implementation Run Log (What I Did)

This document records the full pipeline I executed for dataset acquisition, cleanup, and training. It serves as the single reference for Chapter 5 (System Implementation and Testing): what was run, in what order, with what results, and where everything is documented.

**Training and tuning runs (metrics, hyperparameters, per-run notes):** [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md).

**Accuracy testing, algorithm review (vs docs/chapters), small-data training, and test commands:** [MODEL_TRAINING_AND_EVAL_LOG.md](MODEL_TRAINING_AND_EVAL_LOG.md).

---

## E2E run I did (end-to-end until dataset is clean and ready for training)

I ran the following as a single end-to-end pass so the dataset is clean and ready for training, and I started model training and documented the tuning process.

1. **Environment** — Using the existing venv under `detection_engine/` (no new venv created).
2. **Acquisition** — Raw data was already present: `data/raw/pii_masking_65k/pii_masking_65k.jsonl` (21,300) and `data/raw/synthetic_phi.jsonl` (2,000). Total raw: 23,300. I did not re-run `acquire_datasets.py`.
3. **Cleanup (with English-only filter)** — I installed `langdetect` and ran the cleanup script so only English records are kept for ClinGuard:
   ```powershell
   cd C:\Users\USER\Projects\clinguard-ai-shield\detection_engine
   .\venv\Scripts\Activate.ps1
   pip install langdetect -q
   python scripts/clean_phi_data.py
   ```
   **Result:** 23,300 raw → **12,465** cleaned (dropped **10,835** non-English records, 0 invalid, 0 dupes). Train: **8,725** | Val: **1,869** | Test: **1,871**. Stats written to `data/cleaned/stats.json`.
4. **Training** — I started the PHI model training on the cleaned data:
   ```powershell
   python train_phi_model.py
   ```
   Training runs with default settings (bert-base-uncased, 2 epochs, batch size 4). When it finishes, the model and tokenizer are saved to `phi_model/`. Eval metrics and per-epoch details are in [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) (Run 2); final numbers can be taken from `phi_model/trainer_state.json` or the latest checkpoint after the run completes.

The dataset is **clean and ready for training**: cleaned files are in `detection_engine/data/cleaned/` (train.json, val.json, test.json, stats.json). Model training and full tuning are documented in [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) so you can keep track of every run and tuning choice.

---

## 1. Environment and setup

**What I did:** I used a single Python virtual environment under `detection_engine/` for acquisition, cleanup, and training. I did not use any datasets that require signing up (no DBMI, no PhysioNet credentials).

**Commands I ran:**

```powershell
cd C:\Users\USER\Projects\clinguard-ai-shield\detection_engine
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Relevant files:**

- `detection_engine/requirements.txt` — dependencies (transformers, torch, datasets, accelerate, etc.).
- `detection_engine/TRAINING.md` — full pipeline summary and env vars.

---

## 2. Dataset acquisition (no sign-up)

**What I did:** I ran the acquisition script so that it fetches only **public** datasets (no registration, no DUA). The script tries ai4privacy/pii-masking-65k and pii-masking-300k first, then optionally n2c2 (which I did not rely on), then generates synthetic data.

**Command I ran:**

```powershell
cd C:\Users\USER\Projects\clinguard-ai-shield\detection_engine
.\venv\Scripts\Activate.ps1
python scripts/acquire_datasets.py
```

**Output I got:**

```
Acquiring PHI datasets for ClinGuard (primary: public PII, no sign-up)...
  ai4privacy/pii-masking-65k: saved 21300 records to C:\...\detection_engine\data\raw\pii_masking_65k
  ai4privacy/pii-masking-300k: skipped (Dataset loaded but no valid records (missing tokens/labels or empty)).
  bigbio/n2c2_2006_deid: skipped (Dataset scripts are no longer supported...). Use pii_masking_65k + synthetic instead (no sign-up).
  bigbio/n2c2_2014_deid: skipped (...). Use pii_masking_65k + synthetic instead (no sign-up).
  synthetic: wrote 2000 examples to C:\...\detection_engine\data\raw\synthetic_phi.jsonl
Done. Next: run clean_phi_data.py then train_phi_model.py.
```

**Where the raw data ended up (before cleanup):**

| Source | Records | File path (before cleanup) |
|--------|---------|----------------------------|
| ai4privacy/pii-masking-65k | 21,300 | `detection_engine/data/raw/pii_masking_65k/pii_masking_65k.jsonl` |
| Synthetic (in-repo) | 2,000 | `detection_engine/data/raw/synthetic_phi.jsonl` |
| **Total raw** | **23,300** | — |

**Schema of raw data:** Each line is one JSON object: `{"text": "<string>", "spans": [{"start": <int>, "end": <int>, "category": "<NAME|EMAIL|PHONE|...>"}, ...]}`.

**PII-Masking 65k — what it contains:** The file is **multilingual**. It has **English** (business/legal/HR style), **French** (e.g. “nous avons besoin”, “veuillez”, “pour”), and **German** or other languages. Categories in the raw file: NAME, ENTITY, EMAIL, DATE, PHI, SSN (no MRN/PHONE/KENYA_NATIONAL_ID—those come from synthetic data). For ClinGuard (English clinical/Kenya context) we **filter to English only** in the cleanup step so non-English rows are dropped. Full description: [docs/PII_MASKING_65K_DATASET.md](PII_MASKING_65K_DATASET.md).

**Documentation I used:** [docs/DATASET_ACQUISITION.md](DATASET_ACQUISITION.md) — recommended path (no sign-up), full table of datasets, and run log. I did **not** use n2c2 or MIMIC (they require sign-up).

---

## 3. Data cleanup and algorithms

**What I did:** I ran the cleanup script so that all raw JSONL is normalised, validated, deduplicated, and split into train/validation/test. The script applies specific algorithms and writes a stats file that records them.

**Command I ran:**

```powershell
cd C:\Users\USER\Projects\clinguard-ai-shield\detection_engine
.\venv\Scripts\Activate.ps1
python scripts/clean_phi_data.py
```

**Output I got (with language filter, KEEP_LANG=en):**

```
  Language filter (keep=en): dropped 10835 non-en records.
  train.json: 8725 records
  val.json: 1869 records
  test.json: 1871 records
  stats.json: written
Cleanup done: 23300 raw -> 12465 cleaned (dropped 0 invalid, 10835 non-en, 0 dupes).
Next: python train_phi_model.py
```

**With language filter (KEEP_LANG=en, default):** After installing `langdetect`, the cleanup script drops non-English records from pii_masking_65k (French, German, etc.) and writes `dropped_language` to `stats.json`. This keeps the training data aligned with ClinGuard’s English-only context.

**Before and after (this run, from stats.json):**

| Metric | Before (raw) | After (cleaned) |
|--------|--------------|-----------------|
| Total records read | 23,300 | — |
| Dropped (invalid spans / empty text) | 0 | — |
| Dropped (non-English, KEEP_LANG=en) | — | 10,835 |
| After deduplication | — | 12,465 |
| Train | — | 8,725 |
| Validation | — | 1,869 |
| Test | — | 1,871 |
| Label distribution | — | See stats.json |

**Label distribution (this run):** DATE 2,754; PHI 17,106; SSN 535; NAME 5,516; MRN 852; EMAIL 1,338; ENTITY 3,802; PHONE 576; KENYA_NATIONAL_ID 326.

**Algorithms I used (exactly as in the script and in stats.json):**

| Step | Algorithm | Description |
|------|-----------|-------------|
| 1. Input | JSONL read with UTF-8-sig | Strip BOM; one JSON object per line. |
| 2. Encoding | UTF-8 normalisation | `text.encode("utf-8", errors="replace").decode("utf-8")`. |
| 3. Text normalisation | Strip + whitespace collapse | `strip()` then `re.sub(r"\s+", " ", s)` for dedup key and output. |
| 4. Span normalisation | Span validation | Accept `spans` / `entities` / `labels`; output `{start, end, category}`; drop span if `start < 0`, `end > len(text)`, or `start >= end`; map unknown category to PHI. |
| 5. Language filter | langdetect (when KEEP_LANG=en) | Keep only records detected as English; drop French/German/etc. from pii_masking_65k for ClinGuard context. Disable with `KEEP_LANG=`. |
| 6. Deduplication | Exact match on normalised text | Set of normalised strings; keep first occurrence. |
| 7. Split | Random shuffle + fixed ratio | `random.shuffle(seed=42)`; 70% train, 15% val, 15% test. |

**Where the cleaned data and stats are:**

- `detection_engine/data/cleaned/train.json` — 8,725 records (after English-only filter).
- `detection_engine/data/cleaned/val.json` — 1,869 records.
- `detection_engine/data/cleaned/test.json` — 1,871 records.
- **`detection_engine/data/cleaned/stats.json`** — before_count, dropped_invalid, **dropped_language** (10,835), after_dedup (12,465), train/val/test counts, label_distribution, **algorithms_used** (including **language_filter**), and **parameters** (seed 42, split_ratio, keep_lang).

**Documentation I used:** [docs/DATASET_CLEANUP.md](DATASET_CLEANUP.md) — cleanup steps, algorithms table (including language filter), and before/after tables. [docs/PII_MASKING_65K_DATASET.md](PII_MASKING_65K_DATASET.md) — full description of pii_masking_65k (schema, categories, languages, cleanup).

---

## 4. Training the PHI model and tuning

**What I did:** I ran the token-classification training on the cleaned data (train 8,725, val 1,869) with default hyperparameters. The trainer uses the same tokeniser and label scheme as the detection engine.

**Command I ran (from detection_engine with venv active):**

```powershell
cd C:\Users\USER\Projects\clinguard-ai-shield\detection_engine
.\venv\Scripts\Activate.ps1
python train_phi_model.py
```

**What the script uses:**

- **Data:** `detection_engine/data/cleaned/train.json` and `val.json` (from the cleanup step above; English-only after language filter).
- **Base model:** `bert-base-uncased` (overridable with env `BASE_MODEL`).
- **Hyperparameters:** 2 epochs (`PHI_EPOCHS`), batch size 4, max length 128; see [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) for the full tuning reference and where to change them.
- **Labels:** Binary PHI (O, B-PHI, I-PHI) derived from span categories; see `detection_engine/train_phi_model.py` (LABEL2ID, spans_to_token_labels).
- **Output:** Model and tokeniser saved to `detection_engine/phi_model/` (or `PHI_MODEL_PATH`). The file `phi_model/label_map.json` stores the label mapping.

**Keeping track of training and tuning:** Every run (data used, hyperparameters, eval metrics) is documented in **[docs/TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md)**. After each training run, copy from `phi_model/trainer_state.json` (or the latest checkpoint) the `best_metric`, `log_history` eval losses, and any changed hyperparameters into that log so you have a full history.

**After training:** The detection engine (`phi_detector.py`) loads from `phi_model/` when `USE_ML=1` and `config.json` is present; otherwise it uses regex + entropy or the fallback NER model.

**Documentation I used:** [detection_engine/TRAINING.md](../detection_engine/TRAINING.md) — full pipeline, venv, env vars, and where the model is saved and how phi_detector loads it. [docs/TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) — per-run training and tuning log.

---

## 5. File and doc reference (what I used)

| What | Where |
|------|--------|
| Acquisition script | `detection_engine/scripts/acquire_datasets.py` |
| Cleanup script | `detection_engine/scripts/clean_phi_data.py` |
| Training script | `detection_engine/train_phi_model.py` |
| Synthetic generator | `detection_engine/scripts/generate_synthetic_phi.py` |
| Raw data (public, no sign-up) | `detection_engine/data/raw/pii_masking_65k/pii_masking_65k.jsonl`, `data/raw/synthetic_phi.jsonl` |
| PII-Masking 65k (schema, languages, cleanup) | [docs/PII_MASKING_65K_DATASET.md](PII_MASKING_65K_DATASET.md) |
| Cleaned data | `detection_engine/data/cleaned/train.json`, `val.json`, `test.json` |
| Before/after + algorithms + dropped_language | `detection_engine/data/cleaned/stats.json` |
| Acquisition (what datasets, no sign-up path) | [docs/DATASET_ACQUISITION.md](DATASET_ACQUISITION.md) |
| Cleanup (algorithms, language filter, before/after) | [docs/DATASET_CLEANUP.md](DATASET_CLEANUP.md) |
| Training (commands, env, model path) | [detection_engine/TRAINING.md](../detection_engine/TRAINING.md) |
| **Training and tuning run log (per-run metrics, hyperparameters)** | [docs/TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) |
| i2b2/n2c2 catalog (optional; sign-up) | [docs/I2B2_N2C2_DATASETS.md](I2B2_N2C2_DATASETS.md) |

---

## 6. Summary (for Chapter 5)

- **Datasets:** I used only **public** sources: **ai4privacy/pii-masking-65k** (21,300 records; **multilingual**—English, French, German) and **in-repo synthetic** (2,000 records). Total raw: 23,300. No DBMI or PhysioNet sign-up. See [PII_MASKING_65K_DATASET.md](PII_MASKING_65K_DATASET.md) for full description.
- **Cleanup:** I ran `clean_phi_data.py` with **language filter** (KEEP_LANG=en). Result: 23,300 raw → **12,465** cleaned (10,835 non-English dropped). Train **8,725** | Val **1,869** | Test **1,871**. All algorithms and counts are in `data/cleaned/stats.json`.
- **Algorithms:** Encoding (UTF-8, BOM stripped), text normalisation (strip + collapse whitespace), span validation (bounds and category), **language filter (keep English only)**, deduplication (exact normalised text), train/val/test split (random seed 42, 70/15/15).
- **Training:** I ran `train_phi_model.py` on the cleaned data (default: bert-base-uncased, 2 epochs, batch 4). Model and tokenizer are saved to `phi_model/`. **Training and tuning are documented per run** in [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md) so you can keep track of metrics and hyperparameters.

All of the above is documented in this run log, in [TRAINING_RUN_LOG.md](TRAINING_RUN_LOG.md), and in `data/cleaned/stats.json`.
