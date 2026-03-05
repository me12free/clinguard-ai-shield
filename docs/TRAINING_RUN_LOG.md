# ClinGuard PHI Model: Training and Tuning Run Log

This log records each training run so you can track data, hyperparameters, and metrics. Update it after every training run (or when you change tuning choices).

**Pipeline overview:** [IMPLEMENTATION_RUN_LOG.md](IMPLEMENTATION_RUN_LOG.md) (acquisition → cleanup → training).

---

## Run 1 (baseline — previous)

- **Date:** (prior run)
- **Data:** `data/cleaned/` (before language filter: 23,300 → 16,309 train, 3,495 val).
- **Hyperparameters:**
  - `BASE_MODEL`: bert-base-uncased
  - `PHI_EPOCHS`: 2
  - `per_device_train_batch_size`: 4
  - `MAX_LENGTH`: 128
  - Labels: O, B-PHI, I-PHI (binary PHI)
- **Checkpoint:** `phi_model/checkpoint-700/` (save_total_limit=1 may overwrite).
- **Metrics (from trainer_state.json):**
  - Best eval_loss: 0.0219 (step 700, epoch 2)
  - Epoch 1 eval_loss: 0.0373; Epoch 2 eval_loss: 0.0219

---

## Run 2 (E2E: cleaned data with English-only filter)

- **Date:** 2026-03-05 (E2E run on behalf of user)
- **Data:** `data/cleaned/` produced **after** language filter (KEEP_LANG=en).
  - **Source:** [data/cleaned/stats.json](../detection_engine/data/cleaned/stats.json)
  - Raw records read: **23,300**
  - Dropped (invalid): **0**
  - Dropped (non-English): **10,835**
  - After dedup: **12,465**
  - **Train:** 8,725 | **Val:** 1,869 | **Test:** 1,871
  - Label distribution: DATE 2,754; PHI 17,106; SSN 535; NAME 5,516; MRN 852; EMAIL 1,338; ENTITY 3,802; PHONE 576; KENYA_NATIONAL_ID 326
- **Hyperparameters:**
  - `BASE_MODEL`: bert-base-uncased
  - `PHI_EPOCHS`: 2
  - `per_device_train_batch_size`: 4
  - `MAX_LENGTH`: 128
  - Labels: O, B-PHI, I-PHI
  - Output: `detection_engine/phi_model/`
- **Command used:**
  ```powershell
  cd detection_engine
  .\venv\Scripts\Activate.ps1
  python train_phi_model.py
  ```
- **Metrics:** (Fill when this run completes.) After `python train_phi_model.py` finishes, copy from `detection_engine/phi_model/trainer_state.json` (or the latest `phi_model/checkpoint-*/trainer_state.json`): `best_metric`, `best_global_step`, and from `log_history` the `eval_loss` per epoch. The script also prints "Eval metrics: ..." at the end.
- **Model output:** `detection_engine/phi_model/` (config.json, tokenizer, pytorch_model.bin, label_map.json).
- **Note:** Training was started as part of the E2E run; it may take a few hours (4,364 steps at ~2–4 s/step). When it completes, update this Run 2 section with the final metrics.

---

## Tuning reference (where to change what)

| What | Where | Default / note |
|------|--------|----------------|
| Epochs | `train_phi_model.py` or env `PHI_EPOCHS` | 2 |
| Batch size | `train_phi_model.py` (per_device_train_batch_size) | 4 |
| Base model | env `BASE_MODEL` | bert-base-uncased |
| Max sequence length | `train_phi_model.py` (MAX_LENGTH) | 128 |
| Learning rate | TrainingArguments in train_phi_model.py | (transformers default) |
| Train/val data | env `PHI_DATA_DIR` | detection_engine/data/cleaned |
| Model output | env `PHI_MODEL_PATH` | detection_engine/phi_model |
| Language filter | env `KEEP_LANG` in clean_phi_data.py | en (empty = no filter) |
| Train/val/test split | clean_phi_data.py (SPLIT_* constants) | 0.7 / 0.15 / 0.15 |
| Random seed | clean_phi_data.py (SEED) | 42 |

---

## How to log the next run

1. Run cleanup (if you changed raw data or language):  
   `python scripts/clean_phi_data.py`  
   Copy from `data/cleaned/stats.json`: before_count, dropped_language, after_dedup, train, val, test.
2. Run training:  
   `python train_phi_model.py`
3. After training, copy from `phi_model/trainer_state.json` (or the latest checkpoint): `best_metric`, `eval_loss` from `log_history`, `num_train_epochs`, `train_batch_size`.
4. Append a new "Run N" section above (or update Run 2 with final metrics).
