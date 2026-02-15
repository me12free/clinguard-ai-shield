# Guide: Training a PHI Detection Model for ClinGuard on Google Colab

This guide walks you through the steps to train a Protected Health Information (PHI) detection model for ClinGuard using Google Colab, based on your project documentation. It covers dataset identification, model layers, and practical steps from start to finish.

---

## 1. Datasets Identified

From your documentation, the following PHI categories and data types should be included in your training data:
- Patient names
- Medical record numbers
- Diagnoses
- Lab results
- Medication lists
- Other PHI patterns (contextual, regulatory)

### Recommended Datasets
- **MIMIC-III/IV**: Contains de-identified clinical notes (https://physionet.org/content/mimiciv/)
- **i2b2 PHI datasets**: Annotated for PHI (https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/)
- **Synthetic PHI datasets**: Create synthetic samples for Kenya-specific data (names, IDs, etc.)

---

## 2. Model Layers Mentioned

Your hybrid detection pipeline should include:
- **Regex Layer**: For pattern-based PHI (names, IDs, dates)
- **Entropy Layer**: For detecting outlier tokens (random IDs, numbers)
- **ML Layer (Transformer)**: For contextual PHI (diagnoses, medications, free text)

---

## 3. Training Steps on Colab

### Step 1: Set Up Colab Environment
```python
!pip install transformers datasets scikit-learn spacy
!python -m spacy download en_core_web_sm
```

### Step 2: Load and Prepare Datasets
```python
from datasets import load_dataset
# Example: Load i2b2 or MIMIC clinical notes
# Replace with your dataset path or use synthetic data
notes = load_dataset('csv', data_files='path/to/clinical_notes.csv')['train']
```
- Annotate PHI entities (if not already annotated)
- Split into train/val/test sets

### Step 3: Regex & Entropy Feature Engineering
```python
import re
import numpy as np
# Example regex for MRNs, names, dates
mrn_pattern = re.compile(r'MRN:\s*\d+')
# Entropy calculation for tokens

def entropy(s):
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum([p * np.log2(p) for p in prob])
```

### Step 4: ML Layer (Transformer Model)
```python
from transformers import AutoTokenizer, AutoModelForTokenClassification, Trainer, TrainingArguments

tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
model = AutoModelForTokenClassification.from_pretrained('distilbert-base-uncased', num_labels=2)
# Prepare data for token classification (NER)
# ...
```

### Step 5: Training
```python
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    evaluation_strategy="epoch",
    save_steps=10_000,
    save_total_limit=2,
)
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)
trainer.train()
```

### Step 6: Evaluation
```python
results = trainer.evaluate()
print(results)
```
- Measure accuracy, precision, recall, F1 for PHI detection

### Step 7: Export Model
```python
model.save_pretrained('clinguard-phi-model')
tokenizer.save_pretrained('clinguard-phi-model')
```

---

## 4. Integration Steps
- Download the trained model and tokenizer
- Integrate with your Python detection engine (as described in your documentation)
- Use regex and entropy layers as pre/post-processing
- Connect to your Laravel API for real-time PHI detection

---

## 5. References
- [MIMIC-IV Dataset](https://physionet.org/content/mimiciv/)
- [i2b2 PHI Challenge](https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/)
- [Transformers Documentation](https://huggingface.co/docs/transformers/index)
- [spaCy NER](https://spacy.io/usage/linguistic-features#ner)

---

## Notes
- Always use de-identified or synthetic data for training.
- Ensure compliance with Kenya Data Protection Act 2019 and HIPAA.
- Document your training process and results for audit and reproducibility.

---

For further customization, add Kenya-specific PHI patterns and policies to your regex and ML layers.
