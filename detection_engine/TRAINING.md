# PHI Model Training (ClinGuard)

Training the PHI detection model for use by `phi_detector.py`. See also [docs/DATASET_CLEANUP.md](../docs/DATASET_CLEANUP.md), [docs/DATASET_ACQUISITION.md](../docs/DATASET_ACQUISITION.md), and [docs/PHI_Model_Training_Guide.md](../docs/PHI_Model_Training_Guide.md).

**Full pipeline as executed (acquisition, cleanup, training commands and outputs):** [docs/IMPLEMENTATION_RUN_LOG.md](../docs/IMPLEMENTATION_RUN_LOG.md).

**Per-run training and tuning log (metrics, hyperparameters, data used):** [docs/TRAINING_RUN_LOG.md](../docs/TRAINING_RUN_LOG.md).

## Full pipeline (recommended)

From the project root, with a single venv for training and inference:

1. **Create and activate venv, install dependencies**
   ```bash
   cd detection_engine
   python -m venv venv
   venv\Scripts\activate   # Windows
   # source venv/bin/activate   # Linux/macOS
   pip install -r requirements.txt
   ```

2. **Acquire datasets** (synthetic + optional n2c2 from Hugging Face)
   ```bash
   python scripts/acquire_datasets.py
   ```
   Writes to `data/raw/synthetic_phi.jsonl` and, if loadable, `data/raw/n2c2_2014/n2c2_2014_deid.jsonl`. See [docs/DATASET_ACQUISITION.md](../docs/DATASET_ACQUISITION.md).

3. **Clean and split data**
   ```bash
   python scripts/clean_phi_data.py
   ```
   Reads `data/raw/`, outputs `data/cleaned/train.json`, `val.json`, `test.json`, and `stats.json`. See [docs/DATASET_CLEANUP.md](../docs/DATASET_CLEANUP.md).

4. **Train the model**
   ```bash
   python train_phi_model.py
   ```
   Uses `data/cleaned/train.json` (and `val.json` if present). Saves model and tokenizer to `phi_model/` (or `PHI_MODEL_PATH`).

5. **Inference**  
   `phi_detector.py` loads the trained model from `phi_model/` when `USE_ML=1` (default) and the directory contains `config.json`; otherwise it uses regex+entropy or the fallback NER model. Set `PHI_MODEL_PATH` to override the path.

## Venv and dependencies

From the project root:

```bash
cd detection_engine
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
```

## Data

- **Cleaned data:** After running `scripts/clean_phi_data.py`, `train.json` and `val.json` (and `test.json`) are in `detection_engine/data/cleaned/`. Format: JSON array of `{"text": "...", "spans": [{"start", "end", "category"}, ...]}`. See [docs/DATASET_CLEANUP.md](../docs/DATASET_CLEANUP.md).
- **No cleaned data:** If `data/cleaned/train.json` is missing, `train_phi_model.py` falls back to a small set of built-in synthetic examples (not suitable for real training).

## Run training

```bash
python train_phi_model.py
```

Optional env vars:

- `PHI_DATA_DIR` — path to cleaned data directory (default: `detection_engine/data/cleaned`)
- `PHI_MODEL_PATH` — output directory for model and tokenizer (default: `detection_engine/phi_model`)
- `BASE_MODEL` — Hugging Face model name (default: `bert-base-uncased`)
- `PHI_EPOCHS` — training epochs (default: 2)

## After training

- **Where the model is saved:** `detection_engine/phi_model/` (or `PHI_MODEL_PATH`). Contains `config.json`, tokenizer files, `pytorch_model.bin` (or safetensors), and `label_map.json`.
- **How phi_detector loads it:** When the detection engine runs, `phi_detector.py` checks for a directory at `PHI_MODEL_PATH` (default `detection_engine/phi_model`) with `config.json`. If present and `USE_ML=1`, it loads the tokenizer and model from that path for NER; otherwise it uses regex+entropy only or the fallback `dslim/bert-base-NER` model.

## Run log: Before and after training

**Before training (data):** Use data produced by the acquisition and cleanup pipeline.

- **Acquisition:** Run `python scripts/acquire_datasets.py`. See [docs/DATASET_ACQUISITION.md](../docs/DATASET_ACQUISITION.md) for what it provides (synthetic `data/raw/synthetic_phi.jsonl`, optional n2c2 from Hugging Face).
- **Cleanup:** Run `python scripts/clean_phi_data.py`. Input: `data/raw/`. Output: `data/cleaned/train.json`, `val.json`, `test.json`, `stats.json`. See [docs/DATASET_CLEANUP.md](../docs/DATASET_CLEANUP.md) for before/after counts and label distribution.

**Training command:** From `detection_engine/` with venv active:

```bash
pip install -q -r requirements.txt   # includes accelerate>=1.1.0
python train_phi_model.py
```

**After training:** Model and tokenizer are in `phi_model/`. The script prints evaluation metrics (if val set is used) and the save path. **To keep track of each run:** Update [docs/TRAINING_RUN_LOG.md](../docs/TRAINING_RUN_LOG.md) with the data used (from `data/cleaned/stats.json`), hyperparameters (epochs, batch size, base model), and metrics from `phi_model/trainer_state.json` or the latest checkpoint (e.g. `best_metric`, `eval_loss` in `log_history`).
