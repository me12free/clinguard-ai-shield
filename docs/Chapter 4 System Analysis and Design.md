# Chapter 4: System Analysis and Design

## 4.1 Introduction

This chapter presents the system analysis and design for the ClinGuard system. The design paradigm used is **Object-Oriented Analysis and Design (OOAD)** as defined in Chapter 3. Section 4.2 sets out the system requirements (functional and non-functional) reviewed in the project. Section 4.3 presents the system analysis diagrams: use case diagram, activity diagram, sequence diagram, entity-relationship diagram, logical database schema, and system sequence diagram. Section 4.4 presents the system design diagrams (ERD and logical schema) with design commentary. Section 4.5 states the design tools used for consistency.

---

## 4.2 System Requirements

System requirements are the configuration that a system must have in order for a hardware or software application to run smoothly and efficiently. Failure to meet these requirements can result in installation problems or performance problems. The former may prevent a device or application from getting installed, whereas the latter may cause a product to malfunction or perform below expectation or even to hang or crash.

Some of the system requirements reviewed in the project include:

### 4.2.1 Functional Requirements

Functional requirements are product features or functions that the system implements to enable users to accomplish their tasks; they describe system behaviour under specific conditions. The following functional requirements were identified and implemented, listed with roman numerals:

**(i) Authentication and Authorization Module**  
This module manages user access control and role-based permissions. The system collects user credentials (email, password, name, role) during registration. Authentication uses secure login with password hashing (bcrypt) to keep credentials secure, together with session management and multi-factor authentication. Roles include Clinician, Administrator, and Security Officer with defined permission levels.

**(ii) PHI Detection and Redaction Module**  
This module identifies and redacts Protected Health Information from AI prompts in real time. It collects prompt text from user inputs and processes it through a hybrid detection engine (regex, entropy analysis, and machine learning). It detects PHI types such as patient names, medical record numbers, phone numbers, email addresses, diagnoses, medications, and dates, and replaces them with standardised placeholders while preserving clinical context.

**(iii) OpenAI Integration Module**  
This module enables secure communication with OpenAI’s API for clinical documentation assistance. It handles API key management, request formatting, response processing, and error handling, with rate limiting, retries, and fallback procedures.

**(iv) RAG Knowledge Retrieval Module**  
The Retrieval-Augmented Generation module enhances AI responses with evidence-based clinical knowledge. It retrieves information from medical knowledge bases (treatment guidelines, drug databases, diagnostic and procedure codes) using vector similarity search to rank relevant clinical information.

**(v) Policy Management Module**  
This administrative module allows organisations to configure PHI detection policies and compliance settings (detection thresholds, redaction rules, bypass permissions, audit requirements). It supports policy templates per department and role, with version control.

**(vi) Audit and Compliance Module**  
This module maintains audit trails for regulatory compliance and security monitoring. It logs user actions, PHI detection events, policy violations, and system access, and generates compliance reports for Kenya Data Protection Act 2019 and searchable audit interfaces for administrators.

**(vii) User Interface Module**  
The frontend provides a web interface for clinicians and administrators. It collects user interactions (forms, navigation) and implements real-time PHI highlighting, safe rewrite suggestions, and display of AI responses with contextual clinical information.

### 4.2.2 Non-Functional Requirements

Non-functional requirements define how the system should perform rather than what it does. The following were addressed, listed with roman numerals:

**(i) System Security**  
System security describes the protection of the system and data from unauthorised access and harm. It was achieved through encrypted data transmission (HTTPS/TLS 1.3), secure password storage (bcrypt hashing), CSRF protection, input validation and sanitisation, rate limiting, and secure session management. Security updates and vulnerability scanning are part of the development lifecycle.

**(ii) Data Security**  
Data security was achieved through encryption in transit and at rest. Sensitive data (PHI, credentials, audit logs) is encrypted to AES-256 standards. Database and file-system encryption, secure key management, data retention policies, and encrypted backups are in place.

**(iii) Performance, Privacy and Benchmarks**  
Performance was addressed through efficient PHI detection with sub-200 ms latency for prompts up to 300 tokens; caching, query optimisation, and asynchronous processing; and load balancing with performance monitoring. Privacy is maintained by design (e.g. PHI redaction before external API calls). The detection model performance is evaluated against benchmarks (e.g. F1 targets for PHI categories).

**(iv) Scalability**  
Modular design for horizontal scaling of web and database servers; containerised deployment (Docker), connection pooling, stateless design; auto-scaling and performance testing.

**(v) Usability**  
Intuitive interface following healthcare best practices; responsive design for desktop and tablet; clear PHI indicators and contextual help; user experience testing with healthcare professionals.

**(vi) Reliability**  
Redundant configurations, failover, error handling; target 99.9% uptime; backups and recovery testing.

**(vii) Compliance**  
Kenya Data Protection Act 2019 and HIPAA-aligned controls; audit logging, data subject rights, breach notification; privacy by design and compliance audits.

**Brief comparison:** Functional requirements define *what* the system does (features and behaviour); non-functional requirements define *how well* the system performs (security, performance, scalability, usability, reliability, compliance).

---

## 4.3 System Analysis Diagrams

The following system analysis diagrams were produced using the OOAD approach defined in Chapter 3.

### 4.3.1 Use Case Diagram

The use case diagram shows functional requirements and actor interactions within the ClinGuard system. Primary actors are Clinician, Security Admin, and System Admin; external service actors are Detection System and OpenAI API. Administrative staff (Chapter 3) use the same web interface as clinicians under the Clinician actor with role-based policies. Use cases include Login, Register, Compose Clinical Notes, Review PHI Detection, Apply Redaction, Submit Prompt to AI, View RAG Context, Emergency Bypass, Configure Policies, View Audit Logs, and Manage Users. Include and extend relationships show dependencies (e.g. Compose includes Review PHI and Redact; Emergency Bypass extends Submit Prompt to AI).

*[Diagram to be inserted here.]*

**Figure 4.1** Use Case Diagram.

---

### 4.3.2 Activity Diagram

The activity diagram models the main flow from user prompt entry through PHI detection, redaction, RAG retrieval, OpenAI call, and audit. It uses UML activity notation: initial and final states, activity states, a decision (PHI detected?), and swimlanes for User/Frontend and Laravel API.

*[Diagram to be inserted here.]*

**Figure 4.2** Activity Diagram.

---

### 4.3.3 Sequence Diagram

The sequence diagram shows the full chat flow: validation, authentication, PHI detection, redaction, RAG query, OpenAI completion, persistence (conversations and audit events), and response. Participants include Clinician, React Frontend, Laravel API, Python Detection Engine, RAG/Vector DB, OpenAI API, and Database. Alternative flows cover unavailability of detection, RAG, or OpenAI. An optional standalone PHI detection flow is included.

*[Diagram to be inserted here.]*

**Figure 4.3** Sequence Diagram.

---

### 4.3.4 Entity-Relationship Diagram (ERD)

The ERD represents the logical data model. Entities are USER, ORGANIZATION, ROLE, POLICY, ALLOWLIST, DETECTION_RULE, AUDIT_EVENT, and CONVERSATION. Primary and foreign keys use entity-specific names. Relationships use verb phrases (e.g. employs, defines, creates) and one-to-many cardinality. The diagram aligns with the logical schema.

*[Diagram to be inserted here.]*

**Figure 4.4** Entity-Relationship Diagram.

---

### 4.3.5 Logical Database Schema

The logical database schema shows how the real database will be formed by logically setting out how the tables and relationships will be formed. It defines all tables with data types, sizes/precision, nullability, keys, and defaults, and is suitable for MySQL. Keys are identified by entity-specific names (e.g. user_id, organization_id) for clarity.

| Table | Purpose | Primary key | Foreign keys |
|-------|---------|-------------|--------------|
| users | System users (clinicians, admins) | user_id | role_id, organization_id |
| organizations | Tenants / healthcare organisations | organization_id | — |
| roles | Role definitions | role_id | — |
| policies | PHI policy per organisation | policy_id | organization_id |
| allowlists | Allowed external services | allowlist_id | organization_id |
| detection_rules | PHI detection rules per org | detection_rule_id | organization_id |
| audit_events | Audit log (chat, login, etc.) | audit_event_id | user_id, organization_id |
| conversations | Stored chat (redacted prompt, summary) | conversation_id | user_id |

*[Diagram or further table detail to be inserted here if required.]*

**Figure 4.5** Logical Database Schema.

---

### 4.3.6 System Sequence Diagram

The system sequence diagram shows high-level interactions between the User and the ClinGuard system as a black box: Login → token; Submit prompt → PHI spans; Confirm/redact; Send for AI → AI response and RAG context.

*[Diagram to be inserted here.]*

**Figure 4.6** System Sequence Diagram.

---

## 4.4 System Design Diagrams

The ERD and logical schema are presented in Sections 4.3.4 and 4.3.5. The design commentary below refers to those sections.

### 4.4.1 Entity-Relationship Diagram

The ER diagram is presented in **Section 4.3.4** above; no duplicate figure is shown here. From a design perspective, the model was normalised to third normal form; foreign key placement (e.g. user_id, organization_id) supports multi-tenancy and audit scoping. Relationships and cardinalities align with the logical schema and the implemented database.

### 4.4.2 Logical Database Schema

The full logical schema is summarised in **Section 4.3.5** above. The logical database schema shows how the real database will be formed by logically setting out how the tables and relationships will be formed. Design choices include data types (BIGINT UNSIGNED, VARCHAR, TIMESTAMP, DECIMAL, JSON, BLOB, TEXT), size/precision, nullability, and keys. The schema is normalised and matches the implemented MySQL database.

---

## 4.5 Design Tools and Implementation Strategy

For consistency, the following tools were used: **Visual Paradigm** for use case, sequence, and other analysis diagrams, and **Mermaid** for diagram specification and rendering. Drawings were captured as screenshots for inclusion in the document to avoid watermarks.

The implementation strategy followed object-oriented principles (modular design, encapsulation, separation of concerns) and supported the Modified Waterfall methodology described in Chapter 3. The OOAD analysis and design provide the foundation for implementation, ensuring the system meets functional and non-functional requirements while maintaining scalability, security, and regulatory compliance.
