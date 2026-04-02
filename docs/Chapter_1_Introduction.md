# Chapter 1: Introduction

**Thesis formatting (faculty template).** The final Word document should use Times New Roman 12 pt throughout, 1.5 line spacing, justified paragraphs, normal margins, and page numbers centred at the bottom. Chapter titles should be centred and bold (for example "Chapter 1: Introduction"). Subsections use numbered bold headings (1.1, 1.2). In-text citations and the reference list must follow **APA** style. The background below should be supported with **current, relevant references** when you compile the References chapter (typical expectation: at least one to one and a quarter pages of background with citations, per class notes).

**Voice.** The report should use **third person** and **reported speech** where the faculty requires it (for example "The study proposed…", "ClinGuard was designed to…") rather than first-person promotional language.

## 1.1 Background

**Conceptualization.** Generative artificial intelligence entered everyday clinical workflows through web-based assistants that draft documentation, answer knowledge questions, and support communication. That shift created a new object of concern for information systems practice: not only whether clinicians would adopt such tools, but how institutions could process **free-text clinical language** without breaching duties under data protection law and professional standards. In Kenya, the **Data Protection Act, 2019** establishes principles including lawful processing, purpose limitation, and integrity and confidentiality of personal data, all of which apply when health-related identifiers or contact data appear in user prompts. Internationally, regimes such as the **Health Insurance Portability and Accountability Act (HIPAA)** in the United States have shaped expectations for **protected health information (PHI)** and for **minimum necessary** use when information is shared with vendors.

**Context.** Healthcare organisations experimented with large language models offered by third parties. Those models improved perceived productivity but introduced **data egress risk**: prompts could contain patient names, medical record numbers, dates of care, telephone numbers, and other attributes that regulators treat as sensitive. Prior mitigation included **manual review**, **ad hoc redaction**, or **avoidance** of external tools. Such approaches scaled poorly, produced uneven behaviour across teams, and rarely generated **structured audit evidence** for security officers.

**Proposed direction.** The ClinGuard project was conceived as a **web-based governance layer** for clinical use of external generative AI. It combined a browser client, a policy-aware application programming interface (API), and a dedicated **PHI detection and redaction** service using rules, heuristics, and machine-learning components where configured. The background above frames why such a system was needed as a focused information systems response to regulated clinical AI use. (Insert APA citations throughout this section in your final submission.)

## 1.2 Problem Statement

**Situational analysis.** Despite adoption of clinical AI, many deployments lacked a **single auditable control point** between the clinician workstation and the model provider. Consumer-style chat experiences did not embed **organisation-specific policies**, **role-based enforcement**, or **immutable-style security logging** suitable for review after incidents. Manual redaction remained **error-prone** and **slow**. Smaller providers often could not procure **enterprise-only** governance suites yet still required defensible controls aligned with the Kenya Data Protection Act and good international practice.

**Weaknesses of informal approaches.** Reliance on user discipline without tooling, inconsistent de-identification, absence of central policy when multiple AI tools appeared in the same institution, and limited forensic trails were recurring weaknesses described in health informatics and security literature.

**Proposed response.** This project addressed the gap by specifying, designing, implementing, and testing a system that **detected and redacted PHI** before outbound calls to external models where policy required it, supported **configurable policies** and **emergency bypass** only when explicitly allowed, and recorded **audit events** for security-relevant actions. The problem statement therefore targeted both **technical leakage risk** and **governance visibility**.

## 1.3 Objectives

### 1.3.1 General objective (aim)

The general objective was to **develop and validate a web-based system** that applied automated PHI detection and redaction, policy configuration, and audit logging so that clinical users could interact with external generative AI in a manner more consistent with organisational and regulatory expectations.

### 1.3.2 Specific objectives (SMART)

The following specific objectives were **specific, measurable, attainable, realistic, and time-bound** within the project period:

(i) To **review** literature and practice on clinical use of large language models, PHI handling, and governance mechanisms for third-party model APIs.

(ii) To **analyse** limitations of informal or manual approaches to protecting sensitive data in AI-assisted clinical workflows.

(iii) To **select and justify** a systems development approach suitable for a regulated full-stack implementation that included a machine-learning component.

(iv) To **analyse and design** a multi-tier architecture, data model, and interaction flows for governed chat and administration (documented in Chapter 4).

(v) To **implement** a working system comprising a React frontend, a Laravel API with role-based access, and a Python detection service with optional retrieval-augmented generation.

(vi) To **test and validate** the implemented system through automated API tests, role-based checks, and evaluation of the PHI detection model on held-out data (documented in Chapter 5).

## 1.4 Research questions

(i) What risks and control patterns appear in the literature when clinical text is processed by third-party generative AI?

(ii) How could functional and non-functional requirements be specified for a system that redacts PHI, applies policies, and records audit events?

(iii) What architecture and data structures support clear separation between presentation, orchestration, detection, and persistence?

(iv) How effectively did the implemented API and model pipeline meet stated requirements under test conditions?

(v) What **testing and validation** mechanisms (automated tests, role checks, model metrics) demonstrated that the system behaved as specified?

## 1.5 Justification

The project was justified on **clinical**, **legal**, and **technical** grounds. Clinicians gained a structured path to use AI assistants without bypassing governance. Compliance and security roles gained **policy objects** and **audit trails** that could be reviewed against internal standards and applicable law. Technically, the work showed how **composable open components** (Laravel, React, FastAPI, and transformer-based named-entity recognition where enabled) could be integrated behind one API, which matters for maintainability and for institutions that prefer **self-hosted** or **hybrid** deployments. The solution was intended to benefit **society** by reducing avoidable disclosure of sensitive health data in AI workflows and to benefit the **IT community** by documenting a reproducible pattern: govern first, then generate, with evidence stored in the database. (Support with references in the final document.)

## 1.6 Scope and limitations

**Scope.** The system covered user registration and authentication, governed chat with optional **emergency bypass** where policy allowed, organisation-scoped **policies**, **conversation** storage with redacted prompts, **audit logging** for security-relevant actions, and **administration** of users and organisations for authorised roles. It integrated with an external model provider through the API layer after redaction. A machine-learning PHI detector was trained and evaluated on project datasets as documented in Chapter 5.

**Out of scope.** The system did **not** replace institutional privacy programmes, legal advice, or formal certification regimes. It did **not** modify electronic health record systems as a primary integration target. **Real-time scraping** of external clinical websites was out of scope.

**Limitations (of the system, not personal limitations).** Detection was **not** guaranteed perfect for all languages, formats, or adversarial input; performance depended on training data and configuration. **Deployment** assumptions (HTTPS, secret management, backups, high availability) remained the organisation’s responsibility. The academic prototype was sized for **demonstration and testing** rather than full hospital-scale load without further capacity planning. Vendor **uptime**, **model behaviour**, and **jurisdictional** interpretation of law remained external constraints.
