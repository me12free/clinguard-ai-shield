Thesis / Word bundle: figure files for Chapters 4 and 5
========================================================

Copy or export PNGs into docs/figures/ using these target names so Markdown embeds resolve. Paths in chapters are figures/Figure_*.png (relative to docs/).

Chapter 4 (analysis and design)
-------------------------------
UML and schema (existing Diagrams/png sources):

  Diagrams/png/clinguard_use_case_bright.png       -> Figure_4_1_use_case.png
  Diagrams/png/clinguard_sequence_chat_bright.png  -> Figure_4_2_sequence.png
  Diagrams/png/Clinguard ERD.png                   -> Figure_4_3_erd.png
  Diagrams/png/db Schema (1).png                   -> Figure_4_4_database_schema.png
  Diagrams/png/clinguard_class_bright.png          -> Figure_4_5_class.png

Caption order in Chapter 4: Figure 4.1 use case, 4.2 ERD (file *_3), 4.3 schema (*_4), 4.4 class (*_5), 4.5 sequence (*_2), 4.6 architecture.

Architecture (create or export your own):

  (your deployment/layer diagram)                  -> Figure_4_6_architecture.png

Optional extra sequence diagrams for login, registration, or policy update: name them Figure_4_7_sequence_login.png etc. and add matching paragraphs in Word if required.

Chapter 5 (implementation, testing, ML evidence)
-----------------------------------------------
Save your screenshots with these names (or rename after export):

  Figure_5_1_development_environment.png     optional PC/GPU info
  Figure_5_2_local_services_running.png    optional three services running
  Figure_5_3_implementation_architecture.png  deployment/topology
  Figure_5_4_landing.png
  Figure_5_5_registration.png
  Figure_5_6_login.png
  Figure_5_7_dashboard.png
  Figure_5_8_chat_redaction.png
  Figure_5_9_conversations.png
  Figure_5_10_policies.png
  Figure_5_11_audit.png
  Figure_5_12_admin_users_orgs.png
  Figure_5_13_access_denied.png
  Figure_5_14_api_auth.png
  Figure_5_15_api_detect_or_chat.png
  Figure_5_16_database_client.png          optional
  Figure_5_17_detection_service_docs.png   optional
  Figure_5_18_phpunit.png
  Figure_5_19_playwright_e2e.png           optional
  Figure_5_20_dataset_statistics.png
  Figure_5_21_training_run.png
  Figure_5_22_evaluation_metrics.png
  Figure_5_23_confusion_matrix.png
  Figure_5_24_sample_inference.png         optional
  Figure_5_25_full_test_suite.png          optional
  Figure_5_26_reports_dashboard.png        Reports tab: KPI cards + Recharts (line/bar/composed)
  Figure_5_27_report_pdf_export.png        Server PDF export (GET /api/reports/export) sample page

Figures marked optional can be omitted if your faculty limits page count; keep at least one figure per subsection you claim in the text.

Appendices (logical schema, API, dataset notes) belong in the thesis as pasted sections, not as repo paths.
