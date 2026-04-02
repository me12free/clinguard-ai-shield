# Chapter 3: System Development Methodology

**Thesis formatting.** Same faculty template as Chapters 1 and 2 (Times New Roman 12 pt, 1.5 line spacing, justified text, APA references). **Diagrams:** Include a **figure of the development methodology** (Modified Waterfall phases) and, if required, cross-reference the **OOAD** diagram types listed in class materials (use case and sequence for analysis; ERD, logical schema, class diagram, architecture for design).

## 3.1 Introduction

This chapter describes the **methodology** applied to analyse, design, implement, and test ClinGuard. The work combined a **structured life-cycle model** with **object-oriented analysis and design (OOAD)** so that requirements, diagrams, and code structure remained aligned. **Structured alternatives** mentioned in class (SSAD, SSADM) were considered; **OOAD** was selected because the implementation used object-oriented frameworks (Laravel, React, Python services) and clear **service boundaries**.

**Agile** is a **family of iterative approaches**, not a single methodology in the sense used in these notes; the project did not claim a full Scrum process but allowed **limited iteration** between neighbouring waterfall phases.

**Section 3.2** presents the development approach and phases. **Section 3.3** justifies that choice. **Section 3.4** summarises **system analysis** artefacts. **Section 3.5** summarises **system design** artefacts (fully developed in Chapter 4). **Section 3.6** lists **deliverables and milestones**, including the **system proposal** and **Gantt chart** expectations. **Section 3.7** lists **tools and technologies**.

## 3.2 Applied development approach

### 3.2.1 Modified Waterfall

The project followed a **Modified Waterfall** life cycle. Unlike strict linear waterfall, short **feedback loops** were permitted between adjacent phases (for example refining requirements after early API sketches, or adjusting the database after test failures), but the **dominant order** remained: requirements and planning; analysis; design; implementation; testing; documentation and packaging for examination.

The phases were operationalised as follows:

**Requirements gathering and planning.** Functional and non-functional requirements were derived from regulatory context, literature (Chapter 2), and role personas (clinician, security administrator, system administrator). Traceability linked major features to tests in Chapter 5.

**Requirements analysis.** Requirements were consolidated into tables and narrative suitable for Chapter 4 and for API design.

**System analysis (OOAD).** **Use case** and **sequence** diagrams captured actors, goals, and message order for the primary **governed chat** path and administration. These diagram types match the **OOAD analysis** list in class notes (use case diagrams, sequence diagrams).

**System design.** **ERD**, **logical/physical relational schema**, **class diagram**, and **system architecture** documented data and software structure before full coding. These match the **OOAD design** list in class notes.

**Implementation.** The stack was built in layers: Laravel API and migrations with PHPUnit feature tests; Python detection service; React client; integration of chat, policies, audit, and administration.

**Testing.** PHPUnit validated HTTP contracts and permissions; manual and Playwright end-to-end tests exercised the UI; the PHI model was trained, validated, and evaluated on held-out data.

**Documentation.** Chapters 4 and 5 recorded analysis, design, build, and verification; appendices held logical schema and API summaries.

**Figure requirement.** A **diagram of Modified Waterfall** with the phases above should appear in the thesis (body or appendix) as directed by the supervisor.

### 3.2.2 Role of OOAD

OOAD provided a **shared vocabulary** (actors, objects, messages) across analysis and design. It did not require a one-to-one mapping from every PHP or TypeScript file to a UML class; it bounded **responsibilities** and **dependencies** so that PHI handling remained in agreed layers.

### 3.2.3 SSAD and SSADM (optional note)

The project did **not** produce **data flow diagrams** or **context diagrams** as primary artefacts; emphasis was on **OOAD** per the technology stack. If the faculty requires DFDs, they may be added as supplementary analysis figures with a short note that the main design followed OOAD.

## 3.3 Justification of Modified Waterfall methodology

**Agile/Scrum** would have supported rapid iteration but the examination-oriented project needed **stable** requirement and design **baselines** documented before defence. Pure agile risked under-documented analysis for a **compliance-sensitive** system.

**Modified Waterfall** balanced **documentation discipline** with **practical rework** between neighbouring phases. **OOAD** matched the object-oriented structure of Laravel and React and the **service boundary** with the Python analyser. The combination supported traceability from objectives to tests, as required in class guidance.

## 3.4 System analysis

Analysis focused on **what** the system must do from an external viewpoint.

### 3.4.1 Use case diagram

The **use case diagram** identified human actors (clinician, security administrator, system administrator) and system actors (detection and retrieval service, external model provider). Use cases included authentication, governed chat, conversation review, policy management, audit review, and user or organisation administration. **Include** and **extend** relationships separated mandatory redaction from conditional emergency bypass. The diagram is **Figure 4.1** in Chapter 4.

### 3.4.2 Sequence diagram

A **sequence diagram** for **governed chat** ordered messages among the browser, Laravel API, Python service, optional vector store, external model API, and database, including alternative fragments for failure modes. It is **Figure 4.5** in Chapter 4.

## 3.5 System design

Chapter 4 contains the full design specification. The following subsections list the **roles** of each design artefact, as required in class notes.

### 3.5.1 Database schema

The **entity-relationship diagram** and **relational (physical) schema** documented entities, relationships, keys, and table definitions for organisations, users, roles, policies, conversations, audit events, and related structures. They appear as **Figures 4.2 and 4.3** in Chapter 4 and align with **Appendix A** (logical database specification). The **logical schema** explains how tables and relationships implement the data model before migration.

### 3.5.2 Wireframes and mockups

**Wireframes** or **mockups** link requirements to layout. **Design-time** sketches may appear in Chapter 4 if the faculty expects them; **implemented** screenshots belong primarily in **Chapter 5** (per examination practice in comparable projects).

### 3.5.3 System architecture

The **system architecture** diagram shows major **deployment units** (browser, API server, detection service, database, external AI) and **trust boundaries**. It appears as **Figure 4.6** in Chapter 4.

### 3.5.4 Class diagram

The **class diagram** summarises principal software elements across the frontend, Laravel layer, and Python detection components. It is **Figure 4.4** in Chapter 4.

## 3.6 System deliverables and milestones

### 3.6.1 System proposal

The **system proposal** (early submission) stated the **title**, **problem**, **objectives**, **scope**, and **planned methodology**. The present document is the **evolved** report after implementation; it satisfies the proposal’s promises by recording analysis, design, build, and test evidence in later chapters.

### 3.6.2 Deliverables for examination

Deliverables included: refined **introduction, literature review, and methodology** chapters; **OOAD and architecture figures**; **relational database** implemented via migrations; **REST API** with authentication and permissions; **React** client; **Python** detection service; **training and evaluation artefacts** for the PHI model; **automated and manual tests**; and documentation sufficient for replication.

### 3.6.3 Gantt chart and timeline

A **Gantt chart** covering the project from **requirements through testing** should appear in **Appendix A** (or as directed by the school), showing Semester 1 work through Chapter 4 and Semester 2 work through implementation, testing, and defence preparation, consistent with class timelines discussed in lectures.

## 3.7 Tools and technologies

The following tools supported the methodology phases (expand or cite versions in Chapter 5 as needed):

| Phase | Tools |
|-------|--------|
| Authoring and version control | Git; code editor (for example Visual Studio Code) |
| Backend API | PHP, Laravel, Composer, Laravel Sanctum |
| Database | MySQL |
| Frontend | Node.js, npm, React, TypeScript, Vite, Tailwind CSS |
| Detection and ML | Python, FastAPI, PyTorch and Transformers (when ML path enabled), ChromaDB, sentence-transformers |
| External AI | OpenAI API (configurable model) |
| Testing | PHPUnit, Playwright |
| Diagrams | PlantUML, Mermaid, or drawing tools per project convention |
