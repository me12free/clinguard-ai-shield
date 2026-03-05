# ClinGuard PHI Dataset Acquisition (Chapter 5.3)

This document describes **which datasets are used** for PHI detection model training, **how they are retrieved** (links, credentials, license), and **initial row/entity counts and sample schema** before cleanup. It supports Chapter 5 (System Implementation and Testing) Section 5.3 (Description of the Dataset).

**Full pipeline as executed (commands, outputs, before/after):** [IMPLEMENTATION_RUN_LOG.md](IMPLEMENTATION_RUN_LOG.md).

---

## 1. Recommended path: public data (no sign-up)

**Use these first** — no registration, no DUA, no credentials:

| Dataset | Source | Access | Output path |
|---------|--------|--------|-------------|
| **ai4privacy PII-Masking 65k** | [Hugging Face: ai4privacy/pii-masking-65k](https://huggingface.co/datasets/ai4privacy/pii-masking-65k) | Public; `load_dataset(...)` with `pip install datasets` | `detection_engine/data/raw/pii_masking_65k/pii_masking_65k.jsonl` |
| **ai4privacy PII-Masking 300k** | [Hugging Face: ai4privacy/pii-masking-300k](https://huggingface.co/datasets/ai4privacy/pii-masking-300k) | Public; same (script caps at 50k rows by default) | `detection_engine/data/raw/pii_masking_300k/pii_masking_300k.jsonl` |
| **Synthetic PHI** | In-repo `generate_synthetic_phi.py` | Always available | `detection_engine/data/raw/synthetic_phi.jsonl` |

Run `python scripts/acquire_datasets.py` from `detection_engine/` (with venv and `datasets` installed). The script downloads the public PII datasets and generates synthetic data. Then run `scripts/clean_phi_data.py`. **No sign-up or DUA is required.**

---

## 2. Datasets used (full table)

| Dataset | Source | Access | License / Notes |
|---------|--------|--------|------------------|
| **PII-Masking 65k (recommended)** | [ai4privacy/pii-masking-65k](https://huggingface.co/datasets/ai4privacy/pii-masking-65k) | **Public; no sign-up** | ~21k rows; PII NER (NAME, EMAIL, PHONE, DATE, SSN, etc.); synthetic PII. |
| **PII-Masking 300k (optional)** | [ai4privacy/pii-masking-300k](https://huggingface.co/datasets/ai4privacy/pii-masking-300k) | **Public; no sign-up** | Larger; script can cap at 50k rows. |
| **Synthetic PHI** | In-repo `generate_synthetic_phi.py` | Always available | Kenya-aligned; clinical-style templates. |
| **n2c2 2006/2014** | BigBio on Hugging Face | Often gated or deprecated | **Requires DBMI registration if obtained officially.** |
| **MIMIC-III/IV** | PhysioNet | **Credentialed access only** | DUA and training required. |
| **i2b2/n2c2 (DBMI portal)** | [DBMI Data Portal](https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/) | **Registration and DUA required** | See [I2B2_N2C2_DATASETS.md](I2B2_N2C2_DATASETS.md). |

For **reproducibility without any sign-up**, the pipeline uses **synthetic + ai4privacy pii-masking-65k** (and optionally 300k). Cleanup and training are the same if you later add n2c2 or MIMIC (see [DATASET_CLEANUP.md](DATASET_CLEANUP.md)).

---

## 3. How to Retrieve Each Dataset

### 3.1 Public PII datasets (no sign-up) — recommended

- **ai4privacy/pii-masking-65k** (primary public source)
  - **URL:** https://huggingface.co/datasets/ai4privacy/pii-masking-65k
  - **Retrieval:** Run `detection_engine/scripts/acquire_datasets.py` with venv active and `pip install datasets`. The script calls `load_dataset("ai4privacy/pii-masking-65k")`, converts token+BIO to text+spans, and writes **`detection_engine/data/raw/pii_masking_65k/pii_masking_65k.jsonl`**.
  - **No registration or DUA.** Same for `ai4privacy/pii-masking-300k` (output in `pii_masking_300k/`).
- **Output:** One JSON object per line: `{"text": "...", "spans": [{"start", "end", "category"}, ...]}`. Categories mapped to ClinGuard (NAME, EMAIL, PHONE, DATE, SSN, ENTITY, PHI, etc.).

### 3.2 Synthetic (in-repo, always available)

- **Script:** `detection_engine/scripts/generate_synthetic_phi.py`
- **Command (from project root or detection_engine):**
  ```bash
  cd detection_engine
  python scripts/generate_synthetic_phi.py --count 2000
  ```
- **Environment:** `PHI_SYNTHETIC_COUNT=500` to override default 2000.
- **Output:** `detection_engine/data/raw/synthetic_phi.jsonl` (one JSON object per line: `{"text": "...", "spans": [{"start", "end", "category"}, ...]}`).
- **License:** N/A (synthetic, no real patient data). Aligns with Kenya Data Protection Act 2019 and HIPAA (no PHI in training data).

### 3.3 n2c2 2006 & 2014 (optional; often gated or requires sign-up)

- **Catalog:** Full i2b2/n2c2 challenge list, citations, and links: [I2B2_N2C2_DATASETS.md](I2B2_N2C2_DATASETS.md).
- **PHI datasets tried by script:** `bigbio/n2c2_2006_deid`, `bigbio/n2c2_2014_deid`.
- **Retrieval:** Run `detection_engine/scripts/acquire_datasets.py`; it attempts both. If gated or failing, install `datasets` in venv and re-run, or use synthetic and/or manual DBMI portal download.
- **After successful load:** Converted to project span format and saved under `data/raw/n2c2_2006/n2c2_2006_deid.jsonl` and `data/raw/n2c2_2014/n2c2_2014_deid.jsonl`. Cleanup script reads all `data/raw/n2c2_*/*.jsonl`.
- **License:** Per dataset card; original data subject to [n2c2 DUA](https://n2c2.dbmi.hms.harvard.edu/data-use-agreement).

### 3.4 MIMIC-III/IV (optional; requires credentialed access)

- **Links:**
  - MIMIC-IV: https://physionet.org/content/mimiciv/
  - MIMIC-III: https://physionet.org/content/mimic-iii/
  - Getting started: https://mimic.mit.edu/docs/gettingstarted/access/
- **Steps:**
  1. Complete human subjects research training (e.g. CITI).
  2. Sign the PhysioNet Data Use Agreement.
  3. Request access; after approval, download via cloud (BigQuery, GCS, AWS) or ZIP.
- **Place exported clinical notes** (e.g. CSV or JSON with text and any PHI annotations) under `detection_engine/data/raw/mimic/` and name files so that `clean_phi_data.py` can be extended to read them (see [DATASET_CLEANUP.md](DATASET_CLEANUP.md)).
- **License:** PhysioNet credentialing and DUA; do not attempt to re-identify; report potential PHI to PHI-report@physionet.org.

### 3.5 i2b2/n2c2 (DBMI portal; requires registration + DUA)

- **URL:** https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/
- **Steps:** Register at the portal, request access to the n2c2 2014 de-identification (or other) dataset, accept terms. Download the released files.
- **Place downloaded files** (e.g. XML or converted JSON) under `detection_engine/data/raw/n2c2/` (or keep Hugging Face conversion in `n2c2_2014/` if you use the HF mirror).
- **License:** Per DBMI/n2c2 terms.

---

## 4. Initial State (Before Cleanup)

- **Raw data location:** `detection_engine/data/raw/`
  - **`pii_masking_65k/pii_masking_65k.jsonl`** — from public ai4privacy/pii-masking-65k (no sign-up); primary public source.
  - **`pii_masking_300k/pii_masking_300k.jsonl`** — optional, from ai4privacy/pii-masking-300k.
  - **`synthetic_phi.jsonl`** — in-repo generated; Kenya-aligned.
  - `n2c2_2014/`, `n2c2_2006/` — only if BigBio load succeeded or manual DBMI export.
  - `mimic/` — optional, after manual PhysioNet export.
- **Schema (project standard):** Each record: `{"text": "<string>", "spans": [{"start": <int>, "end": <int>, "category": "<NAME|MRN|DATE|EMAIL|PHONE|SSN|ID_NUMBER|KENYA_NATIONAL_ID|ENTITY|PHI>"}]}`.
- **Initial counts (example, synthetic only):** e.g. 2000 records; categories NAME, MRN, DATE, EMAIL, PHONE, SSN, KENYA_NATIONAL_ID, etc. See [DATASET_CLEANUP.md](DATASET_CLEANUP.md) for before/after cleanup counts and label distribution.

### 4.1 Run log: What acquisition provides (before cleanup)

After running `python scripts/acquire_datasets.py` (with venv and `datasets` installed):

| Source | Result | Location (no sign-up) |
|--------|--------|------------------------|
| **ai4privacy/pii-masking-65k** | ~21.3k records | `detection_engine/data/raw/pii_masking_65k/pii_masking_65k.jsonl` |
| **ai4privacy/pii-masking-300k** | Up to 50k records (capped) or skipped | `detection_engine/data/raw/pii_masking_300k/pii_masking_300k.jsonl` |
| **Synthetic** | 2000 examples | `detection_engine/data/raw/synthetic_phi.jsonl` |
| **n2c2 HF** | Often skipped (deprecated scripts / gated) | Use only if you have DBMI access; otherwise rely on pii_masking_65k + synthetic. |

**Before cleanup — sample raw rows (synthetic):**

```json
{"text": "Kenya national ID 96001338 for Mwangi Kariuki. Admitted 04/05/2003.", "spans": [{"start": 18, "end": 26, "category": "KENYA_NATIONAL_ID"}, {"start": 33, "end": 47, "category": "NAME"}, {"start": 50, "end": 60, "category": "DATE"}]}
{"text": "Blood type on file for Mwangi Mutua. MRN 231291390. DOB 1992-02-12.", "spans": [{"start": 23, "end": 35, "category": "NAME"}, {"start": 37, "end": 46, "category": "MRN"}, {"start": 49, "end": 59, "category": "DATE"}]}
```

**Before cleanup — raw counts:** Depends on acquisition run (synthetic only ≈ 2000; with public PII datasets more). PHI categories include NAME, MRN, DATE, EMAIL, PHONE, SSN, KENYA_NATIONAL_ID, ENTITY, PHI. Next: run `scripts/clean_phi_data.py`; then see [DATASET_CLEANUP.md](DATASET_CLEANUP.md) for **specific algorithms used**, **before and after** counts, and `data/cleaned/stats.json` (includes `algorithms_used` and full metrics).

---

## 5. Running Acquisition

From the project root:

```bash
cd detection_engine
pip install -r requirements.txt   # if not already
python scripts/acquire_datasets.py
```

This will download the **public** ai4privacy pii-masking-65k (and optionally 300k), then generate synthetic data. **No sign-up is required.** Outputs: `data/raw/pii_masking_65k/pii_masking_65k.jsonl`, `data/raw/synthetic_phi.jsonl`, and optionally `pii_masking_300k/`. Next: run `scripts/clean_phi_data.py` (see [DATASET_CLEANUP.md](DATASET_CLEANUP.md)), then `train_phi_model.py` (see [detection_engine/TRAINING.md](../detection_engine/TRAINING.md)).

---

## 6. References

- [PHI_Model_Training_Guide.md](PHI_Model_Training_Guide.md) — Model layers and training steps.
- [DATASET_CLEANUP.md](DATASET_CLEANUP.md) — Cleanup steps and cleaned layout.
- [MIMIC-IV](https://physionet.org/content/mimiciv/)
- [i2b2/n2c2](https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/)
- [I2B2_N2C2_DATASETS.md](I2B2_N2C2_DATASETS.md) — Full i2b2/n2c2 catalog, official DBMI links, BigBio IDs.
- [bigbio/n2c2_2006_deid](https://huggingface.co/datasets/bigbio/n2c2_2006_deid), [bigbio/n2c2_2014_deid](https://huggingface.co/datasets/bigbio/n2c2_2014_deid)
