# i2b2 / n2c2 Clinical NLP Datasets

The majority of these Clinical Natural Language Processing (NLP) data sets were originally created at the NIH-funded National Center for Biomedical Computing **i2b2** (Informatics for Integrating Biology and the Bedside). They are now stewarded by the **Department of Biomedical Informatics (DBMI)** at Harvard Medical School and continue as **n2c2** (National NLP Clinical Challenges).

---

## Official access

- **DBMI Data Portal (registration + DUA required):** https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/
- **Data sets summary and DUA:** https://n2c2.dbmi.hms.harvard.edu/data-sets  
- **Data Use Agreement:** https://n2c2.dbmi.hms.harvard.edu/data-use-agreement  

Each user must access data independently through the portal; data files must not be shared or posted elsewhere (e.g. GitHub).

**How to get the data (official route):**

1. Go to [DBMI Data Portal – n2c2 NLP](https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/).
2. Register / log in; complete the [Data Use Agreement (DUA)](https://n2c2.dbmi.hms.harvard.edu/data-use-agreement).
3. Request access to the desired challenge (e.g. 2006 Deidentification, 2014 Deidentification & Heart Disease).
4. After approval, download the released files (e.g. XML or text with annotations).
5. Convert to ClinGuard format: one JSONL file with one JSON object per line, each `{"text": "<full note text>", "spans": [{"start": <int>, "end": <int>, "category": "<NAME|MRN|DATE|...>"}, ...]}`.
6. Place 2006 data under `detection_engine/data/raw/n2c2_2006/` (e.g. `n2c2_2006_deid.jsonl`) and 2014 under `detection_engine/data/raw/n2c2_2014/` (e.g. `n2c2_2014_deid.jsonl`). Then run `scripts/clean_phi_data.py` and `train_phi_model.py`.

---

## Challenge years and topics

| Year | Topic | Citation / description | Data summary | Size |
|------|--------|-------------------------|--------------|------|
| **2006** | Deidentification & Smoking | Uzuner et al. Evaluating the state-of-the-art in automatic de-identification. JAMIA 2007;14(5):550-63. Uzuner et al. Identifying patient smoking status from medical discharge records. JAMIA 2008;15(1):14-24. | Dataset 1a: 889 unannotated de-identified discharge summaries. 1b: 889 with de-identification annotations (train/test). 1c: 502 with smoking challenge annotations. | 14 MB |
| **2008** | Obesity | Uzuner Ö. Recognizing Obesity and Co-morbidities in Sparse Data. JAMIA 2009;16(4):561-570. | 1237 discharge summaries (overweight/diabetic patients). | 13.6 MB |
| **2009** | Medication | Uzuner et al. Extracting Medication Information from Clinical Text. JAMIA 2010;17(5):514-518. | 1243 de-identified discharge summaries; 696 development, 547 test; medication NER and relations. | 34.7 MB |
| **2010** | Relations | Uzuner et al. 2010 i2b2/VA Challenge on Concepts, Assertions, and Relations in Clinical Text. JAMIA 2011;18(5):552-556. | Partners, BIDMC, UPMC discharge summaries and progress reports; 349 train, 477 test, 877 unannotated. | 2.7 MB |
| **2011** | Coreference | Uzuner et al. Evaluating the state of the art in coreference resolution for electronic medical records. JAMIA 2012;19(5):786-791. | 978 files (2010 corpus + ODIE corpus from Mayo and UPMC). | 3.8 MB |
| **2012** | Temporal Relations | Sun et al. Evaluating temporal relations in clinical text: 2012 i2b2 Challenge. JAMIA 2013;20(5):806-813. | Clinical history and hospital course sections of 310 discharge summaries (Partners, BIDMC); events, time expressions, relations. | — |
| **2014** | Deidentification & Heart Disease | Stubbs et al. Automated systems for the de-identification of longitudinal clinical narratives: Overview of 2014 i2b2/UTHealth shared task Track 1. J Biomed Inform 2015;58(Suppl):S11-S19. | 1304 de-identified longitudinal records (296 patients); 18 HIPAA PHI categories in 6 main groups; CAD/diabetes. | — |
| **2016** | Deidentification & Symptom Severity (RDoC) | Stubbs et al. De-identification of psychiatric intake records. J Biomed Inform 2017;75(Suppl):S4-S18. | 1000 psychiatric intake notes. *Not available for research outside the original challenge (IRB).* | n/a |
| **2018 Track 1** | Clinical Trial Cohort Selection | Stubbs et al. Cohort selection for clinical trials: n2c2 2018 shared task track 1. JAMIA 2019;26(11):1163–1171. | Longitudinal records for 288 patients (2014 challenge subset); diabetes, heart disease risk. | — |
| **2018 Track 2** | Adverse Drug Events & Medication Extraction | Henry et al. 2018 n2c2 shared task on adverse drug events and medication extraction in electronic health records. JAMIA 2020;27(1):3-12. | 505 discharge summaries from MIMIC-III; ADE and medication extraction. | — |
| **2019** | Clinical STS, Family History, Concept Normalization | Multiple tracks. | Clinical semantic similarity, family history extraction, concept normalization. Some 2019 data via Mayo Clinic. | — |

---

## Hugging Face (BigBio) mirrors — programmatic fetch

The **BigBio** project hosts some n2c2/i2b2 datasets on Hugging Face. **Note:** As of 2024–2025, many BigBio n2c2 datasets use legacy dataset loading scripts that are no longer supported by the current Hugging Face `datasets` library; `load_dataset("bigbio/n2c2_2006_deid")` (and similar) may fail with "Dataset scripts are no longer supported." In that case, **obtain the data from the official DBMI Data Portal** (see above) and place converted files under `detection_engine/data/raw/n2c2_2006/` or `n2c2_2014/` in the same JSONL span format. Run from a venv with `pip install datasets` when trying programmatic load.

**PHI / de-identification (for ClinGuard):**

| HF dataset ID | Challenge | Use in ClinGuard |
|---------------|-----------|------------------|
| `bigbio/n2c2_2006_deid` | 2006 Deidentification | 889 discharge summaries with PHI annotations; NER. |
| `bigbio/n2c2_2014_deid` | 2014 Deidentification & Heart Disease | Longitudinal clinical narratives; 18 HIPAA categories, 6 main groups. |

**Other n2c2 on BigBio (clinical NER/relations, not primarily PHI):**

| HF dataset ID | Challenge |
|---------------|-----------|
| `bigbio/n2c2_2008` | 2008 Obesity |
| `bigbio/n2c2_2009` | 2009 Medication |
| `bigbio/n2c2_2010` | 2010 Relations |
| `bigbio/n2c2_2011` | 2011 Coreference |
| `bigbio/n2c2_2018_track1` | 2018 Cohort selection |
| `bigbio/n2c2_2018_track2` | 2018 ADE & medication |

**Example (Python)** — may fail if HF has deprecated script-based loading:

```python
from datasets import load_dataset
# PHI tasks (if load succeeds)
ds_2006 = load_dataset("bigbio/n2c2_2006_deid")
ds_2014 = load_dataset("bigbio/n2c2_2014_deid")
```

The acquisition script `detection_engine/scripts/acquire_datasets.py` attempts to load these and convert to ClinGuard span format (`data/raw/n2c2_2006/`, `data/raw/n2c2_2014/`). If loading fails, download from the [DBMI Data Portal](https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/) and convert to the same JSONL schema (`{"text": "...", "spans": [{"start", "end", "category"}]}`); place under `data/raw/n2c2_2006/` or `data/raw/n2c2_2014/`.

---

## References

- n2c2 data sets: https://n2c2.dbmi.hms.harvard.edu/data-sets  
- DBMI Data Portal: https://portal.dbmi.hms.harvard.edu/projects/n2c2-nlp/  
- i2b2 NLP data sets (legacy): https://www.i2b2.org/NLP/DataSets/Main.php  
- BigBio n2c2 2014 deid: https://huggingface.co/datasets/bigbio/n2c2_2014_deid  
- BigBio n2c2 2006 deid: https://huggingface.co/datasets/bigbio/n2c2_2006_deid  
