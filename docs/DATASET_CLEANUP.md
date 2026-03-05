# ClinGuard PHI Dataset: Acquisition and Cleanup (Chapter 5.3)

This document describes the datasets used for PHI detection model training, how they were acquired, and the **before/after cleanup** steps. It supports Chapter 5 (System Implementation and Testing) Section 5.3 (Description of the Dataset). For dataset sources and retrieval, see [DATASET_ACQUISITION.md](DATASET_ACQUISITION.md).

**Full pipeline as executed (commands, outputs, algorithms):** [IMPLEMENTATION_RUN_LOG.md](IMPLEMENTATION_RUN_LOG.md).

---

## 1. Datasets Used

| Dataset | Source | Access | License / Notes |
|---------|--------|--------|------------------|
| **PII-Masking 65k (primary public)** | [ai4privacy/pii-masking-65k](https://huggingface.co/datasets/ai4privacy/pii-masking-65k) | **No sign-up**; via `acquire_datasets.py` | `detection_engine/data/raw/pii_masking_65k/pii_masking_65k.jsonl` |
| **PII-Masking 300k (optional)** | ai4privacy/pii-masking-300k | **No sign-up** | `data/raw/pii_masking_300k/` |
| **Synthetic PHI** | In-repo `generate_synthetic_phi.py` | Always available | `data/raw/synthetic_phi.jsonl`; Kenya-aligned. |
| **n2c2 2006/2014** (optional) | BigBio / DBMI | Often gated or **requires registration** | `data/raw/n2c2_*/` if loadable. |
| **MIMIC / i2b2** (optional) | PhysioNet / DBMI | **Requires credentialed access** | Manual export; see [DATASET_ACQUISITION.md](DATASET_ACQUISITION.md). |

For **reproducibility without any sign-up**, the pipeline uses **pii_masking_65k** plus **synthetic** data, cleaned under `detection_engine/data/cleaned/`. Optional n2c2/MIMIC require registration (see [DATASET_ACQUISITION.md](DATASET_ACQUISITION.md)).

**PII-Masking 65k detail:** The file `pii_masking_65k.jsonl` contains **multilingual** text (English, French, German, and possibly others). For ClinGuard (English clinical/Kenya context) we filter to **English only** during cleanup. See [PII_MASKING_65K_DATASET.md](PII_MASKING_65K_DATASET.md) for full schema, categories, languages, and cleanup behaviour.

---

## 2. Before Cleanup (Raw Data)

### 2.1 Initial state (raw data)

- **Location:** `detection_engine/data/raw/`
  - `synthetic_phi.jsonl` — one JSON object per line (`text`, `spans`).
  - `n2c2_2014/n2c2_2014_deid.jsonl` — if acquired from Hugging Face (see [DATASET_ACQUISITION.md](DATASET_ACQUISITION.md)).
- **Format:** JSONL with `text` and `spans` (or `entities`/`labels`; script normalises to `spans`).
- **Initial counts (example, synthetic only):**
  - Number of records: e.g. 2000 (default from `generate_synthetic_phi.py --count 2000`), or as per MIMIC/i2b2 export.
  - Schema: `{"text": "...", "spans": [{"start", "end", "category"}, ...]}`.
- **Known issues before cleanup:**
  - Encoding: normalised to UTF-8; BOM stripped (script uses `utf-8-sig`).
  - Duplicates: removed by normalised text in `clean_phi_data.py`.
  - Span validation: spans outside `len(text)` or invalid categories dropped.
  - Train/val/test not yet split; script performs 70/15/15 split with fixed seed.

### 2.2 Sample raw row (before)

```json
{"text": "Patient John Doe MRN 123456 presented with fever.", "labels": [[0, 8, "NAME"], [15, 21, "MRN"]]}
```

Or BIO format:

```
Patient O  John B-NAME  Doe I-NAME  MRN O  123456 B-MRN  presented O  ...
```

---

## 3. Cleanup Steps and Algorithms Used

The script `detection_engine/scripts/clean_phi_data.py` applies the following steps in order. **Specific algorithms** are documented here and also written to `data/cleaned/stats.json` under `algorithms_used`.

| Step | Algorithm / method | Description |
|------|--------------------|-------------|
| **1. Input reading** | JSONL line-by-line parse | Read all `*.jsonl` from `data/raw/synthetic_phi.jsonl` and from each subdir `n2c2_*`, `pii_masking*`; decode with **UTF-8-sig** (strips BOM). |
| **2. Encoding** | UTF-8 normalisation | Re-encode text as `text.encode("utf-8", errors="replace").decode("utf-8")` so invalid sequences are replaced; ensures consistent UTF-8. |
| **3. Text normalisation** | Strip + whitespace collapse | `strip()` then replace one or more whitespace with single space: `re.sub(r"\s+", " ", s)`. Used for dedup key and output. |
| **4. Annotation format** | Span normalisation | Accept `spans`, `entities`, or `labels`; each span as `{start, end, category}` or `[start, end, category]`; output normalised to `{start, end, category}`. |
| **5. Span validation** | Bounds and category check | Drop any span with `start < 0`, `end > len(text)`, or `start >= end`. Drop row if text is empty or no valid spans remain. Category must be in `VALID_CATEGORIES` else mapped to `PHI`. |
| **6. Language filter** | Optional (default: keep English) | If `KEEP_LANG` is set (default `en`), use **langdetect** on first 500 chars; keep only records detected as that language. **pii_masking_65k** contains French, German, etc.—filtering keeps data aligned with ClinGuard (English). Disable with `KEEP_LANG=` (empty). Count of dropped records written to `stats.json` as `dropped_language`. |
| **7. Deduplication** | Exact match on normalised text | Set of normalised strings; keep first occurrence of each, discard subsequent duplicates. |
| **8. Train/val/test split** | Random shuffle + fixed ratio | `random.shuffle(records, seed=42)`; then 70% train, 15% val, 15% test (no stratification). Counts: `n_train = int(n*0.70)`, `n_val = int(n*0.15)`, `n_test = n - n_train - n_val`. |
| **9. Label distribution** | Count by category | Count of span occurrences per `category` over all cleaned records; written to `stats.json` as `label_distribution`. |

**Script and paths:**

- **Script:** `detection_engine/scripts/clean_phi_data.py`
- **CLI (run from project root or from `detection_engine`):**
  ```bash
  cd detection_engine
  python scripts/clean_phi_data.py
  ```
- **Input:** `detection_engine/data/raw/` — reads `synthetic_phi.jsonl` and any `n2c2_2014/*.jsonl`.
- **Output:** `detection_engine/data/cleaned/` — writes `train.json`, `val.json`, `test.json`, and `stats.json` (counts and label distribution).

---

## 4. After Cleanup

### 4.1 Cleaned data layout

- **Location:** `detection_engine/data/cleaned/`.
- **Files:** `train.json`, `val.json`, `test.json` (JSON arrays); each element has `text` and `spans`. `stats.json` holds before/after counts and label distribution.
- **Post-cleanup counts (example, for 2000 synthetic records, 70/15/15 split):**
  - Train: 1400 records
  - Validation: 300 records
  - Test: 300 records
  - Label distribution: see `stats.json` (e.g. NAME, MRN, DATE, EMAIL, PHONE, SSN, KENYA_NATIONAL_ID, …).

### 4.2 Sample cleaned row (after)

```json
{"text": "Patient John Doe MRN 123456 presented with fever.", "spans": [{"start": 8, "end": 16, "category": "NAME"}, {"start": 20, "end": 26, "category": "MRN"}]}
```

### 4.3 Before and after: documented run (from stats.json)

After running `python scripts/clean_phi_data.py`, the script writes `detection_engine/data/cleaned/stats.json`. That file is the **source of truth** for the last run. It contains:

- **Before (raw):** `before_count` (total records read from raw), `dropped_invalid` (rows removed by validation), `dropped_language` (rows removed by language filter when `KEEP_LANG` is set), `after_dedup` (records after deduplication).
- **After (cleaned):** `train`, `val`, `test` (record counts per split), `label_distribution` (count per PHI category).
- **Algorithms used:** `algorithms_used` (encoding, text_normalisation, span_validation, category_mapping, **language_filter**, deduplication, train_val_test_split) and `parameters` (seed, split_ratio, keep_lang).

**Example before/after — synthetic only (2k raw):**

| Metric | Before (raw) | After (cleaned) |
|--------|--------------|-----------------|
| Total records read | 2,000 | — |
| Dropped (invalid) | 0 | — |
| After deduplication | — | 2,000 |
| Train / Val / Test | — | 1,400 / 300 / 300 |
| Label distribution | — | NAME, MRN, DATE, KENYA_NATIONAL_ID, SSN, EMAIL, PHONE (see stats.json) |

**Example before/after — with public PII datasets (synthetic + ai4privacy pii-masking):**

| Metric | Before (raw) | After (cleaned) |
|--------|--------------|-----------------|
| Total records read | 23,300 | — |
| Dropped (invalid) | 0 | — |
| After deduplication | — | 23,300 |
| Train / Val / Test | — | 16,309 / 3,495 / 3,496 |
| Label distribution | — | PHI 34431, ENTITY 6926, NAME 8088, DATE 4105, SSN 1051, PHONE 673, MRN 952, EMAIL 1874, KENYA_NATIONAL_ID 375 |

For the **exact** numbers and **exact algorithms** of your run, read `detection_engine/data/cleaned/stats.json`: it contains `before_count`, `dropped_invalid`, **`dropped_language`** (when language filter is used), `after_dedup`, `train`, `val`, `test`, `label_distribution`, **`algorithms_used`** (including **language_filter** when `KEEP_LANG` is set), and `parameters` (seed, split_ratio, keep_lang).

### 4.4 Features and labels for training

- **Features:** Tokenised input (e.g. subword tokens via Hugging Face tokenizer); input IDs and attention mask.
- **Labels:** Integer IDs for each token (e.g. 0 = O, 1 = B-PHI, 2 = I-PHI), or per-category BIO (e.g. B-NAME, I-NAME, B-MRN, …) mapped to IDs. See `detection_engine/train_phi_model.py` for the exact label mapping and tokenisation.

---

## 5. References

- [PII_MASKING_65K_DATASET.md](PII_MASKING_65K_DATASET.md) — **PII-Masking 65k**: schema, categories, languages (en/fr/de), and why we filter to English for ClinGuard.
- [DATASET_ACQUISITION.md](DATASET_ACQUISITION.md) — Which datasets are used and how they are retrieved (before cleanup).
- [PHI_Model_Training_Guide.md](PHI_Model_Training_Guide.md) — Datasets, model layers, and training steps (including Colab).
- [MIMIC-IV](https://physionet.org/content/mimiciv/)
- [i2b2/n2c2 PHI](https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/)
