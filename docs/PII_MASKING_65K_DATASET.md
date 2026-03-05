# PII-Masking 65k Dataset: Description and Cleanup for ClinGuard

This document describes the **ai4privacy/pii-masking-65k** data under `detection_engine/data/raw/pii_masking_65k/`, how it is used in the ClinGuard pipeline, and how non-English content is handled for our context (English-only clinical/Kenya focus).

---

## 1. Source and Location

| Item | Value |
|------|--------|
| **Hugging Face** | [ai4privacy/pii-masking-65k](https://huggingface.co/datasets/ai4privacy/pii-masking-65k) |
| **Local path** | `detection_engine/data/raw/pii_masking_65k/pii_masking_65k.jsonl` |
| **Acquisition** | Via `scripts/acquire_datasets.py` (no sign-up; public) |
| **Format** | One JSON object per line (JSONL) |

---

## 2. Schema (per record)

Each line is a single JSON object:

```json
{
  "text": "full sentence or paragraph with PII in place",
  "spans": [
    { "start": 0, "end": 4, "category": "NAME" },
    { "start": 35, "end": 43, "category": "ENTITY" }
  ]
}
```

- **`text`**: Raw text (lowercased in this dataset). No placeholder masking in the text itself; spans point to the exact character offsets of PII.
- **`spans`**: List of span objects:
  - **`start`**, **`end`**: Character indices (0-based, end exclusive).
  - **`category`**: Entity type (see below).

---

## 3. Categories in the Raw Data

From inspection of `pii_masking_65k.jsonl`:

| Category | Description (in dataset) | ClinGuard use |
|----------|--------------------------|----------------|
| **NAME** | Person names | Mapped as NAME |
| **ENTITY** | Organizations, roles, company names | Mapped as ENTITY |
| **EMAIL** | Email addresses | Mapped as EMAIL |
| **DATE** | Dates and timestamps | Mapped as DATE |
| **PHI** | Generic PII (IPs, crypto, account numbers, URLs, etc.) | Mapped as PHI |
| **SSN** | Social Security–style numbers | Mapped as SSN |

The dataset does **not** include MRN, PHONE, or KENYA_NATIONAL_ID; those are added by synthetic data and/or regex in the detector. The cleanup script maps any unknown category to **PHI** and only retains categories in `VALID_CATEGORIES` (see `clean_phi_data.py`).

---

## 4. Languages and Why We Filter

The **pii-masking-65k** dataset is **multilingual**. It contains:

- **English (en)** — business/legal/HR-style sentences.
- **French (fr)** — same style (e.g. “nous avons besoin de votre expertise”, “veuillez”, “pour”, “avec”).
- **Other languages** — e.g. **German (de)**, and possibly Italian, Spanish, Dutch (per ai4privacy).

**ClinGuard context** (Chapter 4 / Kenya, clinical, HIPAA-aligned) assumes **English** clinical and administrative text. Non-English rows are not useful for our PHI model and can add noise. Therefore the cleanup pipeline:

1. **Detects language** per record (e.g. with `langdetect` when available).
2. **Keeps only English** when `KEEP_LANG=en` (default for ClinGuard).
3. **Documents** in `stats.json` how many records were dropped by language so you have full insight.

Approximate distribution in the raw file (word-based heuristic on a sample):

- English: ~64%
- French: ~24%
- Other (e.g. German): ~12%

Exact numbers depend on the language detector and the full file; see `data/cleaned/stats.json` after running cleanup with language filter.

---

## 5. Content Characteristics

- **Domain**: Largely business/legal/HR (meetings, projects, compliance, emails, accounts). Not clinical notes per se, but PII types (names, emails, dates, IDs, IPs, etc.) overlap with PHI.
- **Casing**: Text is lowercased.
- **Spans**: Character-level; must satisfy `0 <= start < end <= len(text)` after normalisation. Invalid spans are dropped during cleanup.
- **Encoding**: UTF-8; BOM stripped when reading with `utf-8-sig`.

---

## 6. Cleanup Processes Applied to This Dataset

All raw data under `data/raw/` (including `pii_masking_65k`) is processed by `scripts/clean_phi_data.py`. The steps that affect pii_masking_65k are:

| Step | What is done |
|------|----------------|
| **1. Input** | Read `pii_masking_65k.jsonl` line-by-line; decode with **UTF-8-sig**. |
| **2. Encoding** | UTF-8 normalisation (`encode("utf-8", errors="replace").decode("utf-8")`). |
| **3. Text normalisation** | Strip and collapse runs of whitespace to a single space for dedup key and output. |
| **4. Span validation** | Drop spans with `start < 0`, `end > len(text)`, or `start >= end`; drop records with empty text or no valid spans. |
| **5. Category mapping** | Map unknown categories to PHI; keep only `VALID_CATEGORIES`. |
| **6. Language filter** | If `KEEP_LANG` is set (e.g. `en`), keep only records detected as that language; record `dropped_language` count in stats. |
| **7. Deduplication** | Exact match on normalised text; keep first occurrence. |
| **8. Split** | Random shuffle (seed 42); 70% train, 15% val, 15% test. |

Details and before/after stats are in [DATASET_CLEANUP.md](DATASET_CLEANUP.md) and in `detection_engine/data/cleaned/stats.json` after each run.

---

## 7. Getting the Most Insight

- **Before cleanup**: Inspect `pii_masking_65k.jsonl` (e.g. first 100 lines) to see mix of English vs French vs other.
- **After cleanup**: Check `data/cleaned/stats.json` for `before_count`, `after_dedup`, `dropped_language` (if language filter used), `train`/`val`/`test`, and `label_distribution`.
- **Run log**: See [IMPLEMENTATION_RUN_LOG.md](IMPLEMENTATION_RUN_LOG.md) for the full pipeline as executed (acquire → clean → train).

---

## 8. References

- [DATASET_CLEANUP.md](DATASET_CLEANUP.md) — Cleanup steps and algorithms.
- [DATASET_ACQUISITION.md](DATASET_ACQUISITION.md) — How pii_masking_65k is acquired.
- [IMPLEMENTATION_RUN_LOG.md](IMPLEMENTATION_RUN_LOG.md) — End-to-end run narrative.
