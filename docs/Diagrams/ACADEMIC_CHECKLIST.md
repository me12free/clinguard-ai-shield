# ClinGuard – Academic Diagram Checklist (OOAD)

This checklist confirms that each diagram in `docs/Diagrams` meets standard academic (UML / ERD) requirements.

---

## 1. Use Case Diagram

**File:** `Use Case Diagram.puml` (PlantUML)

| Requirement | Met | Notes |
|-------------|-----|--------|
| Actors as stick figures | Yes | PlantUML `actor "Name"` renders stick figures. |
| Use cases as ovals (ellipses) | Yes | `(Use Case Name)` in PlantUML renders as ovals. |
| System boundary as rectangle | Yes | `rectangle "<<Subsystem>> ClinGuard System" { ... }` encloses use cases. |
| Association (actor–use case) | Yes | Solid lines: `Actor --> UC_Login`, etc. |
| Include relationship | Yes | Dashed arrow with `<<include>>` from base to included use case. |
| Extend relationship | Yes | Dashed arrow with `<<extend>>` from extending to base use case. |
| External systems as actors | Yes | Detection System and OpenAI API as `<<Service>>` actors. |

**Conclusion:** Meets academic UML Use Case Diagram standards. Render with PlantUML for submission.

---

## 2. Entity Relationship Diagram (ERD)

**File:** `ERD Diagram.mmd` (Mermaid)

| Requirement | Met | Notes |
|-------------|-----|--------|
| Entities as rectangles | Yes | Mermaid erDiagram draws entities as rectangles. |
| Attributes listed per entity | Yes | Each entity has id, FKs, and attributes. |
| Primary key (PK) marked | Yes | `id PK` (and PK on primary identifiers). |
| Foreign key (FK) marked | Yes | e.g. `role_id FK`, `organization_id FK`. |
| Relationships with verb phrases | Yes | e.g. "employs", "defines", "creates". |
| Cardinality (one-to-many, etc.) | Yes | `||--o{` (one-to-many), relationships defined. |
| Aligned with logical schema | Yes | Entity and attribute names match `Logical Schema.md`. |
| Entity-specific PK names | Yes | PK shown as user_id, organization_id, role_id, policy_id, allowlist_id, detection_rule_id, audit_event_id, conversation_id (DB column is `id`). |

**Conclusion:** Meets academic ERD standards. Types use int/string/timestamp/float for Mermaid compatibility; full types are in Logical Schema. PK names distinguish which table's id.

---

## 3. Sequence Diagram

**File:** `Sequence Diagram.mmd` (Mermaid)

| Requirement | Met | Notes |
|-------------|-----|--------|
| Participants (lifelines) | Yes | Clinician, React Frontend, Laravel API, Detection Engine, RAG/Vector DB, OpenAI API, Database. |
| Messages (synchronous) | Yes | Solid arrows `->>` for requests; dashed `-->>` for replies. |
| Reply messages | Yes | All external services and DB return replies. |
| Order of interaction | Yes | Full flow: validate → auth → detect → redact → RAG → OpenAI → persist conversation → audit → response. |
| Self-calls | Yes | Validate, Auth::user(), redact(); persistence as L→DB. |
| Alt / error paths | Yes | Alt blocks for detection, RAG, and OpenAI availability/errors. |
| Optional scenario | Yes | Standalone PHI detection (POST /api/detect) shown at end. |

**Conclusion:** Complete, comprehensive sequence covering chat flow, persistence, audit, and error handling; meets UML sequence diagram conventions.

---

## 4. System Sequence Diagram

**File:** `System Sequence Diagram.mmd` (Mermaid)

| Requirement | Met | Notes |
|-------------|-----|--------|
| Single actor (User) | Yes | `actor User`. |
| System as black box | Yes | Single participant “ClinGuard System”. |
| System events (inputs) | Yes | Login, Submit prompt, Confirm/redact, Send for AI. |
| System responses (outputs) | Yes | token, PHI spans, AI response + RAG context. |

**Conclusion:** Meets system sequence diagram convention (actor vs. system).

---

## 5. Activity Diagram

**File:** `Activity Diagram.mmd` (Mermaid)

| Requirement | Met | Notes |
|-------------|-----|--------|
| Initial state | Yes | `Start((Start))` – filled circle. |
| Final state | Yes | `End1((End))` – circle within circle. |
| Activity states (rounded rect) | Yes | All `A1`, `A2`, … nodes as activities. |
| Control flow (arrows) | Yes | Arrows between activities. |
| Decision node with guards | Yes | `Decision{PHI detected?}` with `|Yes|`, `|No|`. |
| Merge | Yes | Both branches (redact / as-is) merge before “Query RAG”. |
| Swimlanes | Yes | “User / Frontend” and “Laravel API” swimlanes. |

**Conclusion:** Meets UML activity diagram conventions (initial/final, decision, merge, swimlanes).

---

## 6. Class Diagram

**File:** `Class Diagram.mmd` (Mermaid)

| Requirement | Met | Notes |
|-------------|-----|--------|
| Classes (name compartment) | Yes | DetectionController, ChatController, services, models. |
| Attributes / operations | Yes | Visibility and types (e.g. `+__invoke(DetectRequest) JsonResponse`). |
| Associations (dependencies) | Yes | Arrows e.g. ChatController --> DetectionService. |
| Design-level (implementation) | Yes | Reflects Laravel controllers, services, Eloquent models. |

**Conclusion:** Meets UML class diagram conventions for design view.

---

## 7. Logical Schema

**File:** `Logical Schema.md` (Markdown tables)

| Requirement | Met | Notes |
|-------------|-----|--------|
| Tabular format | Yes | One table per relation. |
| Data types | Yes | BIGINT UNSIGNED, VARCHAR, TIMESTAMP, DECIMAL, JSON, BLOB, TEXT. |
| Size / precision / scale | Yes | Size/Precision column: 20, 255, 5,4, 65535, etc. |
| Nullable, Key, Default | Yes | Columns for Nullable, Key (PK/FK/UK), Default. |
| Aligned with migrations | Yes | Matches Laravel migrations in `laravel-backend/database/migrations/`. |

**Conclusion:** Meets academic logical schema requirements (types, sizes, keys, defaults).

---

## Summary

| Diagram | File | Academic standard met |
|---------|------|------------------------|
| Use Case | Use Case Diagram.puml | Yes (UML: actors, ovals, boundary, include/extend) |
| ERD | ERD Diagram.mmd | Yes (entities, attributes, PK/FK, verb phrases, cardinality) |
| Sequence | Sequence Diagram.mmd | Yes (participants, messages, order) |
| System Sequence | System Sequence Diagram.mmd | Yes (actor, system black box, events) |
| Activity | Activity Diagram.mmd | Yes (initial/final, decision, merge, swimlanes) |
| Class | Class Diagram.mmd | Yes (classes, operations, associations) |
| Logical Schema | Logical Schema.md | Yes (tables, types, sizes, keys) |

All diagrams in `docs/Diagrams` with the names above meet the stated academic conditions.
