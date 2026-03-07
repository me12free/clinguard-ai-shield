# Faster Training (GPU), Larger Tests, Colab, and Integration

This guide covers: **training faster with GPU**, **running much larger evaluations**, **using Google Colab** (free GPU) to train and then use the model in your project, and **integrating the fully trained model** into ClinGuard.

---

## 1. Train faster and use GPU (local)

### 1.1 PyTorch uses GPU automatically

If you have an **NVIDIA GPU** and **CUDA** installed, PyTorch will use it as soon as you install the CUDA build of PyTorch. No code change is required: `train_phi_model.py` and the Hugging Face `Trainer` already run on GPU when available.

**Check if GPU is used:**

```powershell
cd detection_engine
.\venv\Scripts\Activate.ps1
python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('Device:', torch.device('cuda' if torch.cuda.is_available() else 'cpu'))"
```

### 1.2 Install PyTorch with CUDA (for GPU training)

If the above prints `CUDA available: False`, install the CUDA-enabled build of PyTorch:

1. Check your CUDA version (e.g. run `nvidia-smi`).
2. Install the matching wheel from [pytorch.org](https://pytorch.org/get-started/locally/) (e.g. CUDA 11.8 or 12.1):

```powershell
# Example: CUDA 12.1 (replace with your version)
.\venv\Scripts\pip install torch --index-url https://download.pytorch.org/whl/cu121
```

Then reinstall other requirements if needed:

```powershell
pip install -r requirements.txt
```

### 1.3 Larger batch size on GPU

On GPU you can increase batch size so each step processes more samples and training finishes sooner. Use the `PHI_BATCH_SIZE` environment variable (see below). For example, on a T4 or similar:

```powershell
$env:PHI_BATCH_SIZE="16"
python train_phi_model.py
```

---

## 2. Run much larger tests (full test set)

To evaluate on the **full test set** (or a large subset), do **not** set `EVAL_SAMPLE`, or set it to `0`:

```powershell
cd detection_engine
.\venv\Scripts\Activate.ps1

# Full test set (no limit)
python scripts/evaluate_phi_model.py

# Or explicitly clear any previous value
$env:EVAL_SAMPLE="0"
python scripts/evaluate_phi_model.py
```

The script reads `data/cleaned/test.json` and runs the model on every example. Results are written to `phi_model/eval_report.json` (accuracy, precision, recall, F1). On CPU this can take a while; on GPU it will be faster if the eval script is updated to use GPU (currently it runs on the same device as the loaded model).

---

## 3. Integrate the trained model into your project (ready for integration)

After training (locally or on Colab), the model is **ready for integration** as soon as it sits in the right place.

### 3.1 Where the model must be

- **Directory:** `detection_engine/phi_model/` (or the path you set as `PHI_MODEL_PATH`).
- **Contents:**  
  `config.json`, tokenizer files (e.g. `tokenizer.json`, `tokenizer_config.json`, `vocab.txt`), model weights (`pytorch_model.bin` or `model.safetensors`), and `label_map.json`.

If you trained locally with defaults, this is already the case. If you trained on Colab, download the saved model and unzip it into `detection_engine/phi_model/` (see Section 4).

### 3.2 How ClinGuard uses it

- **Detection engine:** `phi_detector.py` loads from `phi_model/` when:
  - `USE_ML=1` (default), and  
  - The model directory contains `config.json`.
- **Environment (optional):** Set `PHI_MODEL_PATH` to a different folder if you keep the model elsewhere.
- **Laravel/API:** Your backend calls the Python detection service (FastAPI or script); that service uses `phi_detector.py`, which in turn uses the model in `phi_model/`.

No extra “integration” code is needed: once the files are in `phi_model/`, the existing pipeline uses the new model. To meet your **quality** requirements (e.g. F1 targets from your docs), train until validation/eval metrics are acceptable, then replace the contents of `phi_model/` with that trained model.

### 3.3 Checklist for “ready for integration”

1. Train until **eval F1 / accuracy** meet your project’s targets (e.g. F1 ≥ 0.92 for direct identifiers if that’s your goal).
2. Save the chosen run’s model into `detection_engine/phi_model/` (or set `PHI_MODEL_PATH` to that folder).
3. Run a **large evaluation** (full test set, Section 2) and keep `eval_report.json` for records.
4. Use the app: the detection service will load this model automatically.

---

## 4. Train on Google Colab (free GPU) and use the model in your project

Yes, you can **train on Colab** and then **use the same model in your project**. Colab gives you a free GPU (e.g. T4), so training is usually **much faster** than on a typical CPU-only machine.

**Full start-to-end guide (all code cells and where to put them):** [COLAB_FULL_GUIDE.md](COLAB_FULL_GUIDE.md).

### 4.1 Steps: Colab training → download → use locally

#### Step 1: Open Colab and enable GPU

1. Go to [Google Colab](https://colab.research.google.com/).
2. **File → New notebook**.
3. **Runtime → Change runtime type → Hardware accelerator: T4 GPU** (or GPU) → Save.

#### Step 2: Install dependencies and prepare data

In a cell:

```python
!pip install -q transformers datasets accelerate scikit-learn torch
```

Upload your **cleaned data** so Colab can see it. For example:

- **Option A – Upload files:**  
  Upload `train.json`, `val.json`, and `test.json` (from `detection_engine/data/cleaned/`) to the Colab runtime (e.g. drag into Files, or use `files.upload()`). Then set `DATA_DIR` to the folder where you put them (e.g. `/content/cleaned`).
- **Option B – Clone repo and use existing data:**  
  If your repo is on GitHub and contains `data/cleaned/`, you can clone and use it:

```python
!git clone https://github.com/YOUR_USERNAME/clinguard-ai-shield.git
%cd clinguard-ai-shield/detection_engine
# Data in data/cleaned/
```

#### Step 3: Run training (same logic as your script)

Use the **same** training logic as in `train_phi_model.py` (same model, tokenizer, labels, and data format) so the saved model is compatible with `phi_detector.py`. Example Colab cell:

```python
import os
import json
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForTokenClassification, Trainer, TrainingArguments
from datasets import Dataset

# Paths (adjust if you uploaded data elsewhere)
DATA_DIR = Path("/content/cleaned")   # or Path("data/cleaned") if you cloned the repo
OUT_DIR = Path("/content/phi_model")
OUT_DIR.mkdir(parents=True, exist_ok=True)

LABEL2ID = {"O": 0, "B-PHI": 1, "I-PHI": 2}
ID2LABEL = {v: k for k, v in LABEL2ID.items()}
MAX_LENGTH = 128

# Load data (same format as your train.json / val.json)
with open(DATA_DIR / "train.json") as f:
    train_data = json.load(f)
with open(DATA_DIR / "val.json") as f:
    val_data = json.load(f)

# Load tokenizer and model (GPU is used automatically in Colab when GPU is enabled)
model_name = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(
    model_name, num_labels=3, id2label=ID2LABEL, label2id=LABEL2ID
)

# You need the same spans_to_token_labels and dataset build as in train_phi_model.py.
# Simplest: copy the full train_phi_model.py into the repo and run it with env vars:
# os.environ["PHI_DATA_DIR"] = str(DATA_DIR)
# os.environ["PHI_MODEL_PATH"] = str(OUT_DIR)
# %run train_phi_model.py
```

**Easiest approach – clone repo and run your script:**

```python
# Cell 1: Clone repo and install deps
!git clone https://github.com/YOUR_USERNAME/clinguard-ai-shield.git
%cd clinguard-ai-shield/detection_engine
!pip install -q transformers datasets accelerate scikit-learn torch
!pip install -q -r requirements.txt

# Cell 2: Upload your data/cleaned (train.json, val.json, test.json) or use existing if in repo
# If you need to upload:
# from google.colab import files
# uploaded = files.upload()  # then move to data/cleaned/

# Cell 3: Train with GPU (Runtime → Change runtime type → T4 GPU)
# Pass env vars into the subprocess so they are visible to the script
!PHI_DATA_DIR=data/cleaned PHI_MODEL_PATH=/content/phi_model PHI_EPOCHS=3 PHI_BATCH_SIZE=16 python train_phi_model.py
```

On Windows Colab you may need to set env in the same process and run with `%run`:

```python
import os
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["PHI_MODEL_PATH"] = "/content/phi_model"
os.environ["PHI_EPOCHS"] = "3"
os.environ["PHI_BATCH_SIZE"] = "16"
%run train_phi_model.py
```

(If you uploaded data to `/content/cleaned`, use `PHI_DATA_DIR=/content/cleaned` or set it in `os.environ`.)

#### Step 4: Zip and download the model

After training, the model is in `/content/phi_model/` (or whatever you set for `PHI_MODEL_PATH`). Zip it and download:

```python
!zip -r phi_model.zip /content/phi_model
from google.colab import files
files.download("phi_model.zip")
```

#### Step 5: Use the model in your project

1. On your **local machine**, unzip `phi_model.zip` into your project:
   - Extract so that `config.json`, tokenizer files, and the model weights are **inside** `detection_engine/phi_model/` (replace the existing contents of `phi_model/` if you had an old model).
2. Optionally run a **large test** (Section 2) to confirm accuracy.
3. Run your app: the detection engine will load the new model from `phi_model/` and it is **ready for integration**.

### 4.2 Will Colab be faster?

- **Yes.** Colab’s free GPU (e.g. T4) is much faster than training on CPU. You can use a **larger batch size** (e.g. 16 or 32) and **more epochs** (e.g. 3) without waiting as long as on CPU.
- Limits: Free Colab can disconnect after idle time or long runs; for very long jobs, save checkpoints and consider Colab Pro or running the same script locally with GPU.

---

## 5. Environment variables summary

| Variable | Purpose | Example |
|----------|---------|--------|
| `PHI_DATA_DIR` | Folder with `train.json`, `val.json`, `test.json` | `detection_engine/data/cleaned` |
| `PHI_MODEL_PATH` | Where to save or load the model | `detection_engine/phi_model` |
| `PHI_EPOCHS` | Training epochs | `3` |
| `PHI_BATCH_SIZE` | Per-device batch size (increase on GPU) | `16` |
| `TRAIN_SAMPLE` | Cap training set size (0 = use all) | `0` or `500` |
| `VAL_SAMPLE` | Cap validation set size | `0` or `200` |
| `EVAL_SAMPLE` | Cap test set size for evaluation (0 = full) | `0` or `500` |
| `BASE_MODEL` | Pretrained model name | `bert-base-uncased` |
| `LOAD_BEST_AT_END` | Load best checkpoint at end of training | `0` or `1` |

---

## 6. References

- [TRAINING.md](../detection_engine/TRAINING.md) – Local training and env vars.
- [PHI_Model_Training_Guide.md](PHI_Model_Training_Guide.md) – Colab-oriented guide and model layers.
- [MODEL_TRAINING_AND_EVAL_LOG.md](MODEL_TRAINING_AND_EVAL_LOG.md) – Accuracy testing and quality tracking.
- [IMPLEMENTATION_RUN_LOG.md](IMPLEMENTATION_RUN_LOG.md) – Full pipeline and integration context.
