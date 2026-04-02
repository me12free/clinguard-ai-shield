# ClinGuard – Diagram Index (OOAD)

All diagrams are in `docs/Diagrams`. Use these **exact filenames** for submission and preview.

**AI / LLM prompt (academic diagrams, Chapter 4 aligned):** See **[CLAUDE_ACADEMIC_DIAGRAM_PROMPT.md](CLAUDE_ACADEMIC_DIAGRAM_PROMPT.md)** for a strict copy-paste prompt and the 20-file attachment list (Use Case = PlantUML per academic checklist; Sequence/Class/ERD = Mermaid).

| # | Diagram | Filename | How to view / export |
|---|---------|----------|------------------------|
| 1 | Use Case | **Use Case Diagram.puml** | PlantUML: CLI `plantuml "Use Case Diagram.puml"`, VS Code PlantUML, or [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml). Export PNG/SVG. |
| 2 | ERD | **ERD Diagram.mmd** | Mermaid: open in editor with Mermaid extension, or [mermaid.live](https://mermaid.live). Export PNG/SVG. |
| 3 | Sequence | **Sequence Diagram.mmd** | Mermaid: same as above. |
| 4 | System Sequence | **System Sequence Diagram.mmd** | Mermaid: same as above. |
| 5 | Activity | **Activity Diagram.mmd** | Mermaid: same as above. |
| 6 | Class | **Class Diagram.mmd** | Mermaid: same as above. |
| 7 | Logical Schema | **Logical Schema.md** | Markdown: overview table + one table per relation (data types, sizes, keys). Open or preview in editor. Aligns with ERD. |

**Chapter 5 & Appendix (Implementation and Testing)**

| # | Diagram | Filename | How to view / export |
|---|---------|----------|------------------------|
| 8 | Testing Paradigm | **Testing Paradigm Diagram.mmd** | Mermaid: [mermaid.live](https://mermaid.live) or VS Code Mermaid extension. For 5.4.2 (unit/feature, integration, E2E; white-box/black-box). |
| 9 | PHI Training Pipeline | **PHI Training Pipeline.mmd** | Mermaid: same as above. For 5.4.1 (data → cleanup → train → evaluate → export). |
| 10 | Dataset Flow | **Dataset Flow Diagram.mmd** | Mermaid: same as above. For 5.3 (sources, cleanup, train/val/test, features/labels). |
| 11 | Project Gantt Chart | **Project Gantt Chart.mmd** | Mermaid: same as above. Appendix: one-year project timeline. |

**ML process (per-step diagrams for Chapter 5 – dataset and training)**

| # | Diagram | Filename | Purpose |
|---|---------|----------|---------|
| 12 | Step 1: Data collection | **ML_Process_Step1_Data_Collection.mmd** | Sources → raw files. |
| 13 | Step 2: EDA | **ML_Process_Step2_EDA.mmd** | Raw/cleaned → EDA → insights. |
| 14 | Step 3: Data cleaning | **ML_Process_Step3_Data_Cleaning.mmd** | Raw → clean → train/val/test + stats. |
| 15 | Step 4: Data preparation | **ML_Process_Step4_Data_Preparation.mmd** | Cleaned → tokenization → BIO labels. |
| 16 | Step 5: Model training | **ML_Process_Step5_Model_Training.mmd** | Train/val → training loop → model artifacts. |
| 17 | Step 6: Evaluation | **ML_Process_Step6_Evaluation.mmd** | Model + test → metrics → report. |
| 18 | Step 7: Deployment | **ML_Process_Step7_Deployment.mmd** | Model → inference (phi_detector). |

See **docs/ML_PROCESS_AND_INSIGHTS.md** for the full process description and insights per step.

**Also in this folder:** `use-case.puml`, `erd.mmd`, `sequence.mmd`, `system-sequence.mmd`, `activity.mmd`, `class.mmd`, `LOGICAL_SCHEMA.md` (same content as the named files). `DIAGRAMS_PREVIEW.md` contains all Mermaid/PlantUML blocks in one place for quick preview.

**How to generate on any platform:** See **`GENERATE_DIAGRAMS.md`** for browser, editor, and CLI steps (Windows, macOS, Linux) to view and export the Logical Schema and every diagram.
