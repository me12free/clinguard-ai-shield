# Appendix outline for final thesis (paste into Word)

Use separate appendix sections in Word. Below is what to copy from the repository or export from tools.

## Appendix A: Logical database specification

**Source:** [LOGICAL_SCHEMA.md](LOGICAL_SCHEMA.md) in the repo root (and [Diagrams/Logical Schema.md](Diagrams/Logical%20Schema.md) if you keep a duplicate).

**Include:** Table names, columns, types, nullability, keys, short descriptions. Optionally embed **Figure A.1** physical schema PNG from `docs/Diagrams/png/` if not already in Chapter 4.

**Optional same appendix:** **Gantt chart** (Figure A.2) if the faculty wants schedule with schema.

## Appendix B: API specification summary

**Source:** [API_SPEC.md](API_SPEC.md).

**Include:** Base URL note, authentication (Bearer token), main route groups (auth, detect, chat, conversations, policies, audit, users, organisations, **reports** after implementation), request/response shapes at summary level. Full OpenAPI export may be attached if available.

## Appendix C: Dataset, training, and evaluation

**Sources:** [DATASET_ACQUISITION.md](DATASET_ACQUISITION.md), [DATASET_CLEANUP.md](DATASET_CLEANUP.md), [PHI_Model_Training_Guide.md](PHI_Model_Training_Guide.md), [ML_PROCESS_AND_INSIGHTS.md](ML_PROCESS_AND_INSIGHTS.md), `detection_engine/` evaluation JSON if present.

**Include:** Data sources, cleaning steps, split ratios, label scheme (BIO), model family, hyperparameters, test-set metrics (accuracy, precision, recall, F1), confusion matrix figure reference.

## Appendix D (optional): Selected code or configuration

Only if the examiner requests: short excerpts of **policy middleware**, **chat pipeline**, or **detection API** (not full repo dumps).

## Appendix E (optional): User quick-start

One-page steps: environment variables, migrate, seed, start Laravel, Python service, Vite; default test accounts (for demonstration only, not production).
