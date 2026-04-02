# Chapter 5: System Implementation and Testing

## 5.1 Introduction

This chapter turns the Chapter 4 design into **running software** and documents **evidence** you will attach as **screenshots**: the **user interface** for each major feature, **API and test tooling** output where it strengthens claims about correctness, and **machine-learning** artefacts (data, training runs, evaluation metrics). Chapter 4 keeps the **UML and architecture** figures; Chapter 5 is the place for **what the implementation actually looks like** in a browser, terminal, or notebook.

ClinGuard was realised as three cooperating products in one solution: a **React** single-page client (TypeScript, Vite, Tailwind CSS), a **Laravel** API over **MySQL**, and a **Python** service (FastAPI) hosting regex and heuristic logic plus an optional **transformer-based** token tagger, **ChromaDB** for retrieval when enabled, and integration with **OpenAI** for completions after governance steps succeed.

**Section map (aligned with class guidance on Chapter 5 structure).** Section **5.2** describes the **implementation environment** under **hardware specifications**, **software specifications**, **architecture**, **system features**, and **API or integration** captures. Section **5.3** describes the **dataset** used for the detector. Section **5.4** describes **testing**: **model training and evaluation**, the **testing paradigm**, **test cases and test data**, and **testing tools**. Section **5.5** presents **testing results**. Section **5.6** summarises **analytics, reports, and PDF export** on the dashboard. Sections **5.7** and **5.8** close with **continuity** and a **chapter summary**.

**How to use this chapter when you paste into Word.** For each subsection below, insert your **PNG** (or PDF page) **directly under** the italic caption line, or export from Markdown after copying the image files into `docs/figures/` using the filenames in `docs/figures/README.txt`. Keep **one figure per primary idea** so the examiner can skim captions in the List of Figures and land on the right page.

---

## 5.2 System implementation

### 5.2.1 Hardware specifications

Development and training used **64-bit** workstations with **at least 8 GB RAM**. **NVIDIA CUDA** GPUs accelerated **transformer** training when available, including cloud notebook runs. If you capture a **system properties** or **GPU panel** screenshot for the examiner, it supports claims about where training ran.

![Figure 5.1: Development environment](figures/Figure_5_1_development_environment.png)

**Figure 5.1** Workstation or GPU environment used for development and model training (optional if redundant).

If you want a second environment figure, use **Figure 5.2** for **three terminals or IDE panels** showing API, Python service, and frontend running together (friend-style “system running” evidence).

![Figure 5.2: Local services running](figures/Figure_5_2_local_services_running.png)

**Figure 5.2** Local services running during development (optional).

### 5.2.2 Software specifications

**Table 5.1** summarises the **software footprint** that was actually installed and referenced in the project.

**Table 5.1** Software stack implemented

| Layer | Technologies |
|-------|----------------|
| Workstation OS | Windows 10/11; Linux (Ubuntu 22.04 class) |
| API and persistence | PHP 8.2+, Laravel 12.x, Composer; MySQL 8.x |
| Client toolchain | Node.js 18+, npm; React, TypeScript, Vite, Tailwind CSS |
| Detection service | Python 3.10+, FastAPI; PyTorch / Transformers when ML enabled; ChromaDB; sentence-transformers |
| External AI | OpenAI API (model family per deployment config) |

**Migrations** and **seeders** instantiated roles and demonstration accounts. Day-to-day development ran **Laravel’s dev server**, a **Python ASGI** host for the analyser, and **Vite** for the frontend. **Environment variables** carried database URLs, service base addresses, and provider keys; those secrets were **never** hard-coded into client assets.

### 5.2.3 System architecture design

This subsection ties the **running** system back to Chapter 4. The narrative is the same **request path**: bearer token from React, permission checks and persistence in Laravel, detection and optional RAG in Python, then OpenAI only when policy allows. The **screenshot** here should be a **deployment or component diagram** you exported for the thesis (not a repeat of every UML page, unless your supervisor wants it). Label **firewalls**, **TLS termination**, or **single-host demo** honestly.

![Figure 5.3: Implementation architecture view](figures/Figure_5_3_implementation_architecture.png)

**Figure 5.3** Implementation or deployment topology (how services run in your demo or target deployment).

### 5.2.4 System features

Each feature below follows the same pattern used in strong project reports: **what the module is for**, **how it behaves**, then a **figure** of the live screen. Write your own one-sentence **interpretation** under each image in Word if the caption needs to name a visible button or field.

#### 5.2.4.1 Landing and entry experience

The **landing** view is the first impression: short value statement, clear paths to **register** and **login**, and layout that works on **desktop** and **tablet** widths common in hospitals.

![Figure 5.4: Landing page](figures/Figure_5_4_landing.png)

**Figure 5.4** Landing or home screen.

#### 5.2.4.2 User authentication

**Registration** collects identity fields and assigns a role consistent with your seeder strategy; **login** exchanges credentials for a **token** used by the SPA. The figure pair can be **side-by-side** in Word or two separate figures (**5.5** and **5.6**) if you prefer.

![Figure 5.5: Registration](figures/Figure_5_5_registration.png)

**Figure 5.5** User registration interface.

![Figure 5.6: Login](figures/Figure_5_6_login.png)

**Figure 5.6** User login interface.

#### 5.2.4.3 Dashboard

After authentication, the **dashboard** orients the user: shortcuts to **chat**, visible **role**, and any **status** (for example detection service health if you surface it).

![Figure 5.7: Dashboard](figures/Figure_5_7_dashboard.png)

**Figure 5.7** Dashboard after login.

#### 5.2.4.4 Clinical chat and redaction

**Chat** is the core feature: outbound text should show **redaction markers** or **substituted tokens** when policy applies, and the **assistant reply** should appear after the governed pipeline completes. Capture one screenshot with **PHI-laden sample text** (synthetic) and one **clean** example if that helps the narrative.

![Figure 5.8: Chat with redaction](figures/Figure_5_8_chat_redaction.png)

**Figure 5.8** Chat interface showing redaction or policy outcome before external AI.

#### 5.2.4.5 Conversations and history

**Conversation list** or **thread detail** proves that messages persist and that **clinicians** see only what their permissions allow.

![Figure 5.9: Conversations](figures/Figure_5_9_conversations.png)

**Figure 5.9** Conversation list or thread history.

#### 5.2.4.6 Policy management

**Security administrators** adjust **organisation policies**: categories, thresholds, enforcement, and **bypass** rules. The screenshot should show **form fields** that map to the API and database columns you describe in Appendix A.

![Figure 5.10: Policy management](figures/Figure_5_10_policies.png)

**Figure 5.10** Policy management interface (security administrator).

#### 5.2.4.7 Audit and compliance views

The **audit** screen lists **security-relevant events** with enough columns to show **who**, **what**, and **when**. If bypass events exist in your seed data, include a row in the capture.

![Figure 5.11: Audit events](figures/Figure_5_11_audit.png)

**Figure 5.11** Audit events interface.

#### 5.2.4.8 User and organisation administration

**System administrators** manage **users** and **organisations**. A second figure shows **access denied** when a **clinician** or **security admin** hits a forbidden route (browser **403** page or API error in a client).

![Figure 5.12: Administration](figures/Figure_5_12_admin_users_orgs.png)

**Figure 5.12** User or organisation administration (system administrator).

![Figure 5.13: Access denied](figures/Figure_5_13_access_denied.png)

**Figure 5.13** Access denied for a user without the required permission.

### 5.2.5 API, database, and integration captures

These figures support **implementation depth** the same way a strong report shows **Postman**, **phpMyAdmin**, or **OpenAPI** pages: they prove the backend exists and responds.

**API login or register.** Capture **request and response** (status **200**/**201**, JSON body with token and user). Blur tokens in the thesis if your institution requires it.

![Figure 5.14: API authentication](figures/Figure_5_14_api_auth.png)

**Figure 5.14** API client showing successful authentication request and response.

**Detect or chat.** Show **POST** to **detect** or **chat** with **redacted** or **span** JSON in the response.

![Figure 5.15: API detect or chat](figures/Figure_5_15_api_detect_or_chat.png)

**Figure 5.15** API client showing detect or chat request and response body.

**Database.** Optional **phpMyAdmin**, **MySQL Workbench**, or **TablePlus** view of **migrated** tables after seeding.

![Figure 5.16: Database view](figures/Figure_5_16_database_client.png)

**Figure 5.16** Database client showing representative tables after migration (optional).

**Detection service.** **OpenAPI** (`/docs`) or a successful **curl** response from the Python service.

![Figure 5.17: Detection service API](figures/Figure_5_17_detection_service_docs.png)

**Figure 5.17** Python detection service documentation or successful health or detect call (optional).

---

## 5.3 Description of the dataset

This section answers the data-mining style questions examiners expect for the **machine-learning** component: **where** examples came from, how they were **cleaned** and **split**, and what **labels** or **entity types** the model learns.

State briefly where **synthetic** and **public** records came from, how **language filtering** and **deduplication** were applied, and how **train / validation / test** splits were formed (approximately **70 / 15 / 15**). The figure can be **console statistics**, a **histogram** of labels, or a **sample** of anonymised rows.

![Figure 5.20: Dataset statistics](figures/Figure_5_20_dataset_statistics.png)

**Figure 5.20** Dataset statistics, label distribution, or sample records after cleaning.

---

## 5.4 Description of testing

Verification mixed **automated** Laravel tests, **live** integration against a running detector when available, and **human** plus **browser-automated** passes over the React UI. The objective was not only **green builds** but **role boundaries that hold under negative tests**.

### 5.4.1 Model training, saving, and evaluation

This subsection documents the **training workflow** and **evaluation** of the detector, parallel to class notes that ask for **screenshots** of training and metrics. If your faculty expects **k-fold cross-validation**, state honestly whether you used it; this project used a **single stratified hold-out split** (train / validation / test) as in Section 5.3, which is acceptable if you justify it against dataset size and reproducibility.

Show **one training run**: **epoch loss**, **learning rate schedule**, or **notebook cell** output from Colab or local GPU. Mention **checkpoint** path and **epoch** count in the body text so the figure is anchored.

![Figure 5.21: Training run](figures/Figure_5_21_training_run.png)

**Figure 5.21** Model training log or notebook excerpt showing progress.

Report **accuracy, precision, recall, and F1** on the **held-out test** set in prose and repeat the numbers in a **small table** in Word if you like. The figure can be a **metrics summary** JSON view, a **bar chart**, or a **classification report** screenshot.

![Figure 5.22: Evaluation metrics](figures/Figure_5_22_evaluation_metrics.png)

**Figure 5.22** Evaluation metrics on the test set.

A **confusion matrix** or **per-entity** recall table helps explain **which PHI types** remain hard. Optionally add **one inference screenshot** (input text and predicted spans) from the detection service or a notebook.

![Figure 5.23: Confusion matrix](figures/Figure_5_23_confusion_matrix.png)

**Figure 5.23** Confusion matrix or per-label error analysis.

![Figure 5.24: Sample inference](figures/Figure_5_24_sample_inference.png)

**Figure 5.24** Sample inference showing spans or BIO tags on clinical text (optional).

### 5.4.2 Testing paradigm

**White-box** testing, in this project, means exercises that reason about **internal structure**: PHPUnit cases that assert **middleware order**, **policy resolution**, or **database state** after an action, where the expected behaviour is tied to Laravel routes and models you implemented.

**Black-box** testing treats the API or UI as a **specification surface**: HTTP feature tests send payloads and assert **status codes** and **JSON shape** without requiring the reader to know method names inside controllers. **Playwright** end-to-end scripts are black-box at the **browser** boundary: they click and type like a user and assert visible outcomes.

Between these extremes, **integration** tests (or manual runs) combine a **real** Python detector with the API when dependencies are available, so **redaction** is validated on **live** inference rather than only mocks.

You may add a **single conceptual figure** for the examination (white-box versus black-box layers over **unit**, **feature**, and **E2E** scopes). If your cohort uses a standard diagram, export it from `docs/Diagrams/Testing Paradigm Diagram.mmd` or an equivalent template.

### 5.4.3 Test cases, test data, and expected outcomes

Table 5.2 samples the **feature-test matrix**; Section 5.5 states observed outcomes at a higher level. External dependencies were **mocked** in the default suite so regressions are caught without billing or network flakiness. Column headings follow the style often required for project reports: **test case**, **description**, **test data**, **experimental outcome**, and **verdict**.

**Table 5.2** Representative test cases

| Test case | Description | Test data | Experimental outcome | Verdict |
|-----------|-------------|-----------|----------------------|---------|
| TC1 | Register a new account through the API | Valid registration payload (name, email, password, organisation) | **201**; JSON includes user and token | Pass |
| TC2 | Authenticate an existing seeded user | Login payload for clinician / security admin / system admin | **200**; token and role payload | Pass |
| TC3 | End an authenticated session | Authenticated **POST** logout | **200** | Pass |
| TC4 | Run detection with identity | **POST** detect with **Bearer** token and sample clinical text | **200**; structured spans or redaction fields | Pass |
| TC5 | Reject anonymous detection | **POST** detect without token | **401** | Pass |
| TC6 | Happy-path governed chat | Chat request with mocked detector and LLM | **200**; redacted prompt echoed in response | Pass |
| TC7 | Permitted bypass path | Bypass flag with permissive organisation policy | **200**; audit fingerprint when applicable | Pass |
| TC8 | Rejected bypass path | Bypass flag with strict policy | **403** | Pass |
| TC9 | Clinician conversation scope | List conversations as clinician | **200**; only own rows | Pass |
| TC10 | Policy index for security role | **GET** policies as security administrator | **200** | Pass |
| TC11 | Policy index denied for clinician | Same **GET** as clinician | **403** | Pass |
| TC12 | Audit index denied for clinician | **GET** audit events as clinician | **403** | Pass |
| TC13 | Audit index for security role | **GET** audit events as security administrator | **200** | Pass |
| TC14 | User directory by role | **GET** users across clinician, security, system roles | **403** or **200** per permission matrix | Pass |
| TC15 | Organisation directory by role | **GET** organisations across roles | **403** or **200** per permission matrix | Pass |
| TC16 | Policy mutation and trace | Security admin **PATCH** policy | **200**; corresponding audit row | Pass |
| TC17 | Permission introspection | **GET** current user profile | **200**; explicit permission list | Pass |

### 5.4.4 Testing tools

**PHPUnit** drove **HTTP-level** feature specs. **Playwright** scripts, where enabled, replayed multi-step UI flows. Exploratory checks used **REST clients** and browsers against **seeded** identities. **Notebooks** and Python utilities validated **NER** metrics outside PHP.

Capture **terminal or IDE** output for PHPUnit and, if used, Playwright, so the chapter **shows** verification rather than only **listing** it.

![Figure 5.18: PHPUnit results](figures/Figure_5_18_phpunit.png)

**Figure 5.18** PHPUnit feature test run (summary or excerpt).

![Figure 5.19: Playwright or E2E](figures/Figure_5_19_playwright_e2e.png)

**Figure 5.19** Playwright or other end-to-end test output (optional).

---

## 5.5 Testing results and discussion

The PHPUnit layer gave a **fast feedback loop** on **routing**, **serialisation**, and **middleware**, the parts most likely to break silently during refactors. **Mocks** for the detector and OpenAI stabilised expectations. Separate **manual and integration** runs with a **live** Python service and trained weights confirmed that **real redaction** behaved plausibly on free-text clinical prompts.

**Table 5.3** aggregates Table 5.2 by **functional area**. Under the stated setup, **every listed case in Table 5.2 passed**.

**Table 5.3** Aggregated API test outcomes

| Area | Cases | Observation | Verdict |
|------|-------|-------------|---------|
| Authentication | TC1 to TC3 | Matches specification | Pass |
| Detection API | TC4 to TC5 | Matches specification | Pass |
| Chat governance | TC6 to TC8 | Matches specification | Pass |
| Conversations | TC9 | Matches specification | Pass |
| Policies | TC10 to TC11 | Matches specification | Pass |
| Audit | TC12 to TC13 | Matches specification | Pass |
| Administration | TC14 to TC15 | Matches specification | Pass |
| Policy + profile | TC16 to TC17 | Matches specification | Pass |

**NER** scores from Section 5.4 answer a different question (**statistical** quality), while these tests answer **behavioural** and **authorisation** correctness. Residual risks include **vendor outages**, **model drift** as language evolves, and the absence of **large-scale load** evidence within this project’s scope.

If you run the **full** suite for a final capture, add **Figure 5.25** as a **single summary** screenshot of all tests passing.

![Figure 5.25: Full test suite](figures/Figure_5_25_full_test_suite.png)

**Figure 5.25** Full automated test summary (optional).

---

## 5.6 Analytics, reports, and PDF export

The dashboard **Reports** tab consumes **GET /api/reports/summary** and shows **role-scoped** analytics: for example **personal** activity for clinicians, **organisation-scoped** audit trends for security administrators, and **cross-organisation** summaries for system administrators. **Recharts** renders **line**, **bar**, and **composed** series where the payload includes time buckets and event types. **Export PDF** calls **GET /api/reports/export** with the same **authorisation** as the JSON route; the server builds a **tabular** summary document (Dompdf) so examiners can verify reporting without relying on client-only screenshots alone.

Insert **Figure 5.26** after you capture the live **Reports** tab with **KPI cards** and at least one **chart** visible.

![Figure 5.26: Reports tab and charts](figures/Figure_5_26_reports_dashboard.png)

**Figure 5.26** Dashboard Reports tab showing analytics cards and charts (scope label should match the logged-in role).

Insert **Figure 5.27** after you capture the **downloaded PDF** (first page is enough) or a **browser PDF preview** of **clinguard-report.pdf** (or the filename your build uses).

![Figure 5.27: PDF export sample](figures/Figure_5_27_report_pdf_export.png)

**Figure 5.27** Sample server-generated report PDF opened in a viewer.

---

## 5.7 Continuity and further development

Timeouts, retries, and **typed errors** in Laravel and Python reduce **hang** scenarios when upstreams stall. **Periodic retraining** and **monitoring** on fresh data can track detector drift. **TLS**, **secret injection**, and **RBAC** remain the baseline for any wider rollout. Natural extensions include **observability** dashboards, **automated regression** on larger prompt corpora, **capacity testing** before hospital-scale adoption, and richer **server-side charting** inside PDF exports if faculty ask for figure parity between screen and print.

---

## 5.8 Chapter summary

Chapter 5 documented the **hardware and software environment**, **architecture view**, **feature-level** screenshots, **API and database** evidence, **dataset** description, **testing paradigm** and **test-case tables**, **model training and evaluation** figures, **aggregated API** results, and **analytics with PDF reporting**. Structural UML and the main architecture diagram remain in **Chapter 4**. **Appendices A through C** carry schema, API, and dataset detail for examiners who need depth.

---

## References

Bibliographic references appear in the **References** chapter. **Appendix A** contains the logical database specification; **Appendix B** summarises the API; **Appendix C** covers dataset and training notes as needed for examination.
