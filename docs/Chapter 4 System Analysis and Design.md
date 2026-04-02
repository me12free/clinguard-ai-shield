# Chapter 4: System Analysis and Design

## 4.1 Introduction

ClinGuard sits at the intersection of clinical workflow, data protection, and third-party generative AI. This chapter records how that problem was **analysed** and how a **coherent design** was produced before implementation. The narrative moves from **how requirements were established**, through **stated capabilities and quality goals**, to **architecture** and **visual models** (use case, data design, object structure, and interaction over time). The design stance is **object-oriented** and consistent with the methodology in Chapter 3. Fine-grained table and field definitions appear in **Appendix A**; API behaviour is summarised in **Appendix B**. Schedule and governance artefacts, if required by the faculty format, sit outside this chapter or in an appendix.

Figures **4.1** to **4.5** are the core UML and data design set. **Figure 4.6** is the high-level architecture graphic. When you assemble the thesis, place each figure **immediately after** the subsection that introduces it, and use the **caption text** supplied below for your List of Figures.

**Section 4.2** traces requirement sources. **Section 4.3** condenses capability and quality requirements into tables. **Section 4.4** explains how major components fit together at runtime and points to the architecture figure. **Section 4.5** presents the diagram set that guided construction, with a short purpose statement before each graphic and a short interpretation after it.

---

## 4.2 Requirements gathering

No single workshop produced the requirement set. It emerged from **several evidence streams** woven together. Statutory and professional context was read through the **Kenya Data Protection Act 2019** and **HIPAA-aligned** practice notes on health identifiers and minimum necessary use. Vendor-facing material for **large language model APIs** clarified what leaves the organisation’s control once a prompt is transmitted. Chapter 2’s literature gap fed **design goals** (governance before generation, explainable redaction, audit trails). Finally, the three intended **personas** (**Clinician**, **Security Admin**, **System Admin**) were used as a checklist: each needed explicit affordances (safe prompting, policy and log visibility, tenant and user lifecycle) and explicit **denials** where separation of duty matters.

Early **UI walkthroughs** on chat, policy, and audit screens surfaced expectations that rarely appear in tables alone: users wanted **visible confidence** that sensitive fragments were caught, **predictable failure** when a service was down, and **no silent drops** of clinical text. Those observations fed the non-functional emphasis in Section 4.3 and the sequence model in Section 4.5. Wireframes or early screenshots, if you include them in the final Word document, belong with this chapter only if your examiner expects **design-time** UI evidence; otherwise **implemented** screenshots are reserved for Chapter 5.

---

## 4.3 System requirements

Requirements split naturally into **capabilities** (what ClinGuard must make possible) and **qualities** (how it must feel and behave while doing so).

### 4.3.1 Functional requirements

Table 4.1 captures the capability contract at headline level. Together, the rows describe a **governed chat path**: identity and roles, PHI handling, optional knowledge retrieval, policy-governed model access, persistence, configuration, oversight, and administration.

**Table 4.1** Functional requirements

| ID | Description |
|----|-------------|
| FRQ 1 | **Onboarding and session security:** account creation, login, and API access backed by password hashing and token issuance. |
| FRQ 2 | **Least-privilege UI and API:** clinicians, security administrators, and system administrators each see and invoke only what their role permits. |
| FRQ 3 | **PHI governance pipeline:** identify and replace protected fragments in outbound (and ad hoc) text before external AI when policy demands it. |
| FRQ 4 | **Orchestrated completion path:** chat and related operations run detection, optional **RAG**, and **OpenAI** completion only when rules allow. |
| FRQ 5 | **Controlled exception path:** emergency **bypass** of redaction exists only when policy explicitly permits it, with **immutable-style audit** of the decision. |
| FRQ 6 | **Conversation record:** store threads and metadata needed for later review within the relational model. |
| FRQ 7 | **Living policy:** authorised staff adjust thresholds, categories, enforcement posture, and related fields **per organisation**. |
| FRQ 8 | **Security telemetry:** append-only style logging of sensitive operations (chat, policy edits, bypass, and kin). |
| FRQ 9 | **Tenant administration:** system administrators manage users and organisations within the implemented scope. |
| FRQ 10 | **Single cohesive client:** a web application covering login, dashboard, chat, and role-specific consoles. |

### 4.3.2 Non-functional requirements

Table 4.2 states cross-cutting qualities. They deliberately overlap with regulation: **privacy** and **auditability** are first-class design inputs, not afterthoughts.

**Table 4.2** Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR 1 | **Usability:** interfaces remain legible and efficient for clinical and back-office users under normal workloads. |
| NFR 2 | **Access control:** every protected route proves identity and checks permission before side effects. |
| NFR 3 | **Secret hygiene:** credentials are hashed at rest; third-party keys never ship to the browser bundle. |
| NFR 4 | **Privacy by design:** default posture minimises raw PHI exposure to vendors; redaction precedes external calls when required. |
| NFR 5 | **Integrity and validation:** relational constraints, input validation, and authorisation combine to prevent casual tampering. |
| NFR 6 | **Operational clarity:** failures in detection, retrieval, or the LLM surface as actionable feedback, not opaque errors. |
| NFR 7 | **Evolvability:** API, database, and Python analyser can be scaled or replaced on independent cadences. |
| NFR 8 | **Demonstrable compliance posture:** audit artefacts support internal review and mapping to applicable data-protection duties. |

---

## 4.4 System Architecture

ClinGuard was conceived as **five cooperating bands**, not a monolith: **presentation** (browser + React), **orchestration** (Laravel REST + auth + business rules), **analysis and retrieval** (Python + optional vector store), **persistence** (MySQL), and **external cognition** (OpenAI over TLS). The intent is twofold: keep **policy, audit, and prompt transformation** on infrastructure the institution controls, and let the **statistical detector and embeddings** improve without rewriting the PHP core.

### 4.4.1 Orchestration layer and service boundaries

**Laravel** owns the request lifecycle: validate input, attach the caller’s **Sanctum** identity, evaluate **permission middleware**, read and write organisations, users, policies, conversations, and audit rows, and **call outward** only after internal rules succeed. The **Python** service is treated as a **specialist dependency**: it returns structured analysis (and optional RAG context) consumed by the API before any LLM call. **React** is a **thin client**: it renders state and never holds provider secrets. When retrieval is enabled, **ChromaDB** sits beside the analyser; completion still flows through the API so logging and redaction stay centralised.

The architecture figure gives examiners a **single-page mental model**: which boxes you operate, which protocols connect them, and where PHI is transformed before it crosses the trust boundary to an external model provider. When you export the diagram, ensure **legends** (HTTPS, internal network, optional GPU for training) match your deployment story.

![Figure 4.6: System architecture](figures/Figure_4_6_architecture.png)

**Figure 4.6** System architecture (presentation, API, detection and RAG, database, external AI).

---

## 4.5 System Design

Design diagrams are the **contract** between analysis and code: they state agreed actors, data shapes, object boundaries, and message order. The subsections follow the usual examination order: **who** can do **what** (use case), **what is stored** (ERD and relational schema), **how code is grouped** (class diagram), and **how time unfolds** during the main clinical workflow (sequence diagram).

### 4.5.1 Use case diagram

A use case diagram answers **which goals** each actor pursues against the system boundary and which use cases **always** run as part of another (**include**) versus which run only **under conditions** (**extend**). For ClinGuard, that distinction matters for **redaction** (normally included in chat) versus **emergency bypass** (extended only when policy allows). External systems appear as secondary actors where the application depends on them to complete a goal.

![Figure 4.1: Use case diagram](figures/Figure_4_1_use_case.png)

**Figure 4.1** Use case diagram for ClinGuard.

**Interpretation.** The diagram should make it obvious that **clinicians** drive chat and conversation review, **security administrators** own policy and audit views, and **system administrators** own cross-tenant user and organisation management. Machine actors (**detection/RAG service**, **OpenAI**) sit outside the organisational boundary but inside the technical workflow.

### 4.5.2 Database schema

The **entity-relationship** view expresses **business meaning** (who belongs to which organisation, how policies attach, how conversations and audit rows relate to users). The **physical schema** view expresses **implementation truth**: table names, column types, keys, and nullability as in **MySQL**, traceable to **Appendix A**. Together they show that persistence was designed **before** bulk coding, not improvised during it.

![Figure 4.2: Entity-relationship diagram](figures/Figure_4_3_erd.png)

**Figure 4.2** Entity-relationship diagram.

![Figure 4.3: Database schema diagram](figures/Figure_4_4_database_schema.png)

**Figure 4.3** Database schema diagram.

**Interpretation.** Examiners typically check that every **foreign key** story in the schema matches a **relationship** line in the ERD and that sensitive tables (policies, audit events, conversations) have a clear **owning organisation** or **owning user** path.

### 4.5.3 Class diagram

The class diagram is not a line-by-line map of every file; it is a **structural summary** of layers (client composition, Laravel HTTP and domain types, Python analyser types) and the **dependencies** that must not be inverted (for example the browser must not call OpenAI directly). Stereotypes or package groupings, if you use them on the drawing, should match the technology labels you use in Chapter 5.

![Figure 4.4: Class diagram](figures/Figure_4_5_class.png)

**Figure 4.4** Class diagram.

**Interpretation.** Use this figure in the viva to explain **where** a change lives: UI-only tweaks, API rule changes, detector model swaps, or database migrations.

### 4.5.4 Sequence diagram

The **sequence** diagram for **governed chat** is the most important dynamic view: it shows **when** redaction runs relative to retrieval and completion, **where** failures can occur, and **what** gets persisted. **Alt** or **opt** fragments (detector timeout, empty RAG hit, OpenAI error) keep one diagram readable without hiding unhappy paths.

![Figure 4.5: Sequence diagram (chat flow)](figures/Figure_4_2_sequence.png)

**Figure 4.5** Sequence diagram for chat and PHI handling.

**Interpretation.** Align this figure with the test cases in Chapter 5: each **horizontal segment** should correspond to something you can **observe** in logs, API payloads, or screenshots (redacted prompt text, audit event types, HTTP status codes).

If your faculty expects **additional** sequence diagrams for **login**, **registration**, or **policy update**, add them as **Figure 4.7**, **4.8**, and so on after this subsection, each with the same pattern: purpose paragraph, figure, interpretation. The primary submission can still rely on **Figure 4.5** as the critical path.

---

## References

Full citations, legislation, and standards appear in the **References** chapter. **Appendix A** holds the logical database specification; **Appendix B** summarises the API surface.
