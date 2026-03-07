# ClinGuard PHI Model: Full Google Colab Guide (Start to End)

This guide walks you through **training the PHI detection model on Google Colab** from start to finish, with every code cell and where to put it. At the end you will download the trained model and plug it into your project.

---

## Before you start (on your PC)

1. **Get your cleaned data** from your project:
   - `detection_engine/data/cleaned/train.json`
   - `detection_engine/data/cleaned/val.json`
   - `detection_engine/data/cleaned/test.json`  
   If you don’t have these yet, run locally first: `python scripts/acquire_datasets.py` then `python scripts/clean_phi_data.py` (see [DATASET_CLEANUP.md](DATASET_CLEANUP.md)).

2. **Decide how you’ll get code and data into Colab:**
   - **Option A:** Your repo is on **GitHub** (public or you’re okay cloning it). You’ll clone the repo and then upload only the three JSON files (since `data/cleaned/` is gitignored).
   - **Option B:** You don’t use GitHub for this. You’ll upload the three JSON files **and** the file `detection_engine/train_phi_model.py` into Colab.

The steps below use **Option A** (clone + upload data). If you use Option B, the “Clone” cell is replaced by “Create folder + upload `train_phi_model.py`” and you’ll put the JSONs in a `data/cleaned/` folder you create.

---

## Step 1: Open Colab and turn on GPU

1. Go to **https://colab.research.google.com/**.
2. **File → New notebook**.
3. **Runtime → Change runtime type**.
4. Set **Hardware accelerator** to **T4 GPU** (or “GPU”) → **Save**.

---

## Step 2: Clone the repo and go to the detection engine folder

**Cell 1** (run this first):

```python
# Clone your repo (replace with YOUR GitHub username or full repo URL)
!git clone https://github.com/me12free/clinguard-ai-shield.git
%cd clinguard-ai-shield/detection_engine
```

**Where to put it:** First cell of the notebook.  
**If you don’t use GitHub (Option B):** Skip this and create a folder instead, e.g. `!mkdir -p /content/clinguard/data/cleaned` and upload `train_phi_model.py` to `/content/clinguard/` and the three JSONs to `/content/clinguard/data/cleaned/`. Then use `/content/clinguard` as the project root in the next steps.

---

## Step 3: Install dependencies (training only)

**Cell 2:**

```python
# Install only what’s needed for training (no chromadb/sentence-transformers)
!pip install -q transformers datasets accelerate scikit-learn torch langdetect
```

**Where to put it:** Second cell. Run after the clone.

---

## Step 4: Create data folder and upload your train/val/test JSONs

**Cell 3:**

```python
# Create the folder that would normally hold cleaned data (gitignore means it’s not in the repo)
!mkdir -p data/cleaned

# Upload train.json, val.json, test.json from your PC
from google.colab import files
print("Upload train.json")
uploaded = files.upload()
# Move if needed (Colab often puts uploads in current dir)
# Then upload val and test:
print("Upload val.json")
files.upload()
print("Upload test.json")
files.upload()
```

**Where to put it:** Third cell.  
**What to do:** When you run the cell, click “Choose Files” and select **train.json** from `detection_engine/data/cleaned/`. After the first upload, run the same cell again (or add more `files.upload()` calls) and choose **val.json**, then **test.json**. Ensure all three end up in `detection_engine/data/cleaned/` (e.g. if they land in the current directory, run `!mv train.json val.json test.json data/cleaned/`).

**Simpler one-shot upload (one run, pick all three files):**

```python
!mkdir -p data/cleaned
from google.colab import files
uploaded = files.upload()  # Select train.json, val.json, test.json together
for f in ['train.json', 'val.json', 'test.json']:
  if f in uploaded:
    !mv "$f" data/cleaned/
```

**Where to put it:** Use this as Cell 3 instead if you prefer selecting all three files at once.

---

## Step 5: Set environment variables and run training

**Cell 4:**

```python
# Tell the training script where data and output are; use GPU-friendly batch size
import os
os.environ["PHI_DATA_DIR"] = "data/cleaned"
os.environ["PHI_MODEL_PATH"] = "/content/phi_model"
os.environ["PHI_EPOCHS"] = "3"
os.environ["PHI_BATCH_SIZE"] = "16"

# Run your project’s training script (same code as local)
%run train_phi_model.py
```

**Where to put it:** Fourth cell.  
**What it does:** Uses your repo’s `train_phi_model.py` so the saved model is exactly what `phi_detector.py` expects. Training runs on the Colab GPU. When it finishes, the model is in `/content/phi_model/`.

**If you used Option B** (no clone, you uploaded `train_phi_model.py` to `/content/clinguard/` and data to `/content/clinguard/data/cleaned/`):

```python
%cd /content/clinguard
import os
os.environ["PHI_DATA_DIR"] = "/content/clinguard/data/cleaned"
os.environ["PHI_MODEL_PATH"] = "/content/phi_model"
os.environ["PHI_EPOCHS"] = "3"
os.environ["PHI_BATCH_SIZE"] = "16"
%run train_phi_model.py
```

---

## Step 6: Zip the model and download it

**Cell 5:**

```python
# Zip the saved model so you can download one file
!zip -r /content/phi_model.zip /content/phi_model

# Download to your PC
from google.colab import files
files.download("/content/phi_model.zip")
```

**Where to put it:** Fifth cell. Run after training has finished. Your browser will download `phi_model.zip`.

---

## Step 7: On your PC – put the model in your project

1. **Unzip** `phi_model.zip` on your computer. You should get a folder **`phi_model`** with:
   - `config.json`
   - `tokenizer_config.json`, `tokenizer.json`, `vocab.txt` (and maybe other tokenizer files)
   - `model.safetensors` or `pytorch_model.bin`
   - `label_map.json`

2. **Replace** the contents of your project’s model folder with this:
   - Open your project: `clinguard-ai-shield/detection_engine/`
   - **Delete or rename** the existing `phi_model` folder (e.g. rename to `phi_model_old` if you want to keep it).
   - **Copy** the unzipped `phi_model` folder into `detection_engine/` so that you have:
     ```
     detection_engine/
       phi_model/
         config.json
         tokenizer_config.json
         tokenizer.json
         ...
         model.safetensors  (or pytorch_model.bin)
         label_map.json
     ```

3. **Run your app** as usual. The detection engine (`phi_detector.py`) will load this model when `USE_ML=1` and `config.json` is present. No code changes needed.

---

## Quick reference: all cells in order

| Order | What to do | Where to put the code |
|-------|------------|------------------------|
| 1 | Clone repo, `%cd` to `detection_engine` | Cell 1 |
| 2 | `pip install` (transformers, datasets, accelerate, scikit-learn, torch, langdetect) | Cell 2 |
| 3 | `mkdir data/cleaned`, then `files.upload()` for train/val/test.json and move into `data/cleaned/` | Cell 3 |
| 4 | Set `PHI_DATA_DIR`, `PHI_MODEL_PATH`, `PHI_EPOCHS`, `PHI_BATCH_SIZE`, then `%run train_phi_model.py` | Cell 4 |
| 5 | `zip` `/content/phi_model` and `files.download("phi_model.zip")` | Cell 5 |

---

## Optional: check GPU and data before training

**Optional cell** (after Cell 2, before uploading data):

```python
import torch
print("GPU available:", torch.cuda.is_available())
if torch.cuda.is_available():
  print("Device:", torch.cuda.get_device_name(0))
```

**Optional check** that data is in place (after Cell 3):

```python
!ls -la data/cleaned/
```

You should see `train.json`, `val.json`, `test.json`.

---

## If something goes wrong

- **“No module named 'transformers'”**  
  Run Cell 2 again (`pip install ...`).

- **“No such file or directory: train.json” or “data/cleaned”**  
  Run Cell 3 again and ensure all three JSONs are uploaded and moved into `data/cleaned/`. Use `!ls data/cleaned/` to confirm.

- **“Runtime disconnected”**  
  Colab free tier can disconnect. Re-run from Cell 1; you’ll need to re-upload the data (and re-run training). For long runs, consider saving checkpoints (e.g. `save_steps` in the script) or Colab Pro.

- **Out of memory (OOM)**  
  Reduce batch size: in Cell 4 set `os.environ["PHI_BATCH_SIZE"] = "8"` (or `"4"`).

---

## Summary

- **Colab:** Enable GPU → clone repo → install deps → upload `train.json`, `val.json`, `test.json` to `data/cleaned/` → run `train_phi_model.py` via `%run` with env vars → zip `/content/phi_model` → download `phi_model.zip`.
- **Your PC:** Unzip and place the `phi_model` folder inside `detection_engine/`. Your project then uses this model with no extra integration steps.

For GPU training options and local integration details, see [GPU_AND_COLAB_TRAINING.md](GPU_AND_COLAB_TRAINING.md).
