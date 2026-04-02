# Claude prompt: academic diagrams (Chapter 4 + ClinGuard context)

---

## Simple prompt (documentation only)

**Attach these files only** (all are under `docs/` except `.puml` / `.mmd` in `docs/Diagrams/`):

| # | File |
|---|------|
| 1 | `docs/Chapter 4 System Analysis and Design.md` |
| 2 | `docs/Diagrams/ACADEMIC_CHECKLIST.md` |
| 3 | `docs/Diagrams/Use Case Diagram.puml` |
| 4 | `docs/Diagrams/Sequence Diagram.mmd` |
| 5 | `docs/Diagrams/Class Diagram.mmd` |
| 6 | `docs/Diagrams/ERD Diagram.mmd` |
| 7 | `docs/Diagrams/LOGICAL_SCHEMA.md` (or `Logical Schema.md`) |
| 8 | `docs/API_SPEC.md` |

**Copy this prompt into Claude:**

```text
You are helping with academic OOAD documentation for ClinGuard.

Use ONLY the attached documentation. Do not invent actors, use cases, entities, or flows that are not in Chapter 4 (sections 4.3 and 4.4) or the attached diagram/schema files.

Output specification code only (no images), in this order:
A) Use Case — PlantUML (academic UML: boundary, include/extend). Base it on the attached Use Case Diagram.puml and Chapter 4.3.1.
B) Sequence — Mermaid sequenceDiagram. Base it on the attached Sequence Diagram.mmd and Chapter 4.3.2 (include alt paths for errors).
C) Class — Mermaid classDiagram. Base it on the attached Class Diagram.mmd and Chapter 4.3.3 (stereotypes <<frontend>>, <<backend>>, <<base>>, <<python>>).
D) ERD — Mermaid erDiagram. Base it on the attached ERD Diagram.mmd and Chapter 4.4.1 (PK/FK, verb phrases, cardinalities).
E) Logical database schema — Markdown tables only, aligned with LOGICAL_SCHEMA.md and Chapter 4.4.2.
F) Short checklist: how each output meets ACADEMIC_CHECKLIST.md.

Keep naming identical to Chapter 4 and the attached files. Refine for clarity if needed, but do not replace the system with generic “App/API/DB” diagrams.
```

---

## Full prompt (with optional code attachments)

Copy everything inside the **PROMPT START / PROMPT END** block into Claude. Attach the files listed under **Attachments (max 20)** if you need implementation-level alignment.

---

## PROMPT START

You are a senior academic systems analyst. Your job is to produce **diagram specification code only** (no images), strictly aligned with **Chapter 4: System Analysis and Design** of the attached ClinGuard document.

### Non-negotiable rules

1. **Semantic source of truth:** Use **only** the attached Chapter 4 sections **4.3** (analysis) and **4.4** (design) plus the attached canonical diagram files from the ClinGuard repository. **Do not invent** actors, use cases, participants, entities, or relationships that are not implied there or in the attached API/controllers/models.

2. **Chapter 4 must be reflected verbatim in naming:**
   - **Actors:** Clinician, Security Admin, System Admin; external service actors: Detection System, OpenAI API.
   - **Use cases (4.3.1):** Login, Register, Compose Clinical Notes, Review PHI Detection, Apply Redaction, Submit Prompt to AI, View RAG Context, Emergency Bypass, Configure Policies, View Audit Logs, Manage Users.
   - **Include/extend (4.3.1):** Compose includes Review PHI and Redact; Submit includes View RAG; Emergency Bypass **extends** Submit Prompt to AI.
   - **Sequence participants (4.3.2):** Clinician, React Frontend, Laravel API, Python Detection Engine, RAG/Vector DB, OpenAI API, Database; include **alt** paths for detection/RAG/OpenAI failure; optional standalone PHI detection.
   - **Class diagram (4.3.3):** Stereotypes `<<frontend>>`, `<<backend>>`, `<<base>>`, `<<python>>`; components named as in Chapter 4 (e.g. PHIDetection, PromptEditor, UserInterface, BaseController, UserController, PolicyManager, OpenAIService, PHIDetectionService, RegexAnalyzer, EntropyAnalyzer, MLClassifier, PHIDetector). Align relationships with Chapter 4 (inheritance, aggregation, dependency).
   - **ERD entities (4.4.1):** USER, ORGANIZATION, ROLE, POLICY, ALLOWLIST, DETECTION_RULE, AUDIT_EVENT, CONVERSATION; verb phrases and one-to-many cardinalities; entity-specific PK names (user_id, organization_id, etc.) as in the logical model.

3. **Academic standards (must satisfy all that apply):**
   - **Use case:** System boundary rectangle; associations actor–use case; **include** and **extend** with correct UML semantics (include from base to included; extend from extending use case to base). **Note:** True academic use cases use **stick-figure actors and oval use cases**. Mermaid cannot render those correctly. Therefore output **PlantUML** for the Use Case diagram (not Mermaid), using the same structure as the attached `Use Case Diagram.puml` unless the user’s Chapter 4 text conflicts—in that case follow Chapter 4.
   - **Sequence:** Lifelines, synchronous calls (`->>`), return messages (`-->>`), **alt/else** for errors, **optional** fragment or note for standalone `/api/detect` if Chapter 4 requires it.
   - **Class:** Classes with attributes and methods; visibility where appropriate; stereotypes; associations (inheritance, aggregation, dependency) consistent with Chapter 4.
   - **ERD:** `erDiagram` in Mermaid; every entity lists attributes; mark **PK** and **FK**; relationships with cardinality (`||--o{` etc.) and **verb phrases** on the relationship line; align attribute names with the attached logical schema.
   - **Database logical schema:** Output as **Markdown tables** (table name, column, type, size, nullable, key, default)—**not** as a diagram graphic. Mirror the attached `LOGICAL_SCHEMA.md` / Chapter 4.4.2 table list.

4. **Output format (exact order):**
   - **A.** Use Case — fenced block labeled `plantuml` (PlantUML only).
   - **B.** Sequence — fenced block `mermaid` with `sequenceDiagram`.
   - **C.** Class — fenced block `mermaid` with `classDiagram`.
   - **D.** ERD — fenced block `mermaid` with `erDiagram`.
   - **E.** Logical schema — Markdown tables only (no mermaid for schema).
   - **F.** Short **academic compliance checklist** (bullet list): for each diagram, state how it meets boundary, PK/FK, include/extend, alt paths, stereotypes, etc.

5. **Quality:** Clean layout, consistent naming (same spelling across all diagrams), no placeholder “TBD” entities, valid syntax. If something is missing from attachments, **state the assumption in one line** and still comply with Chapter 4.

6. **Do not:** Replace Security Admin / System Admin with generic “Admin”; drop RAG or Detection Engine if Chapter 4 includes them; use casual node names like “App” or “Server” instead of the named participants above.

### Task

Generate sections **A through F** now for the **ClinGuard** system, using the attached Chapter 4 and canonical diagram files as the primary reference.

## PROMPT END

---

## Attachments (max 20) — use this exact set

1. `docs/Chapter 4 System Analysis and Design.md`  
2. `docs/Diagrams/ACADEMIC_CHECKLIST.md`  
3. `docs/Diagrams/Use Case Diagram.puml`  
4. `docs/Diagrams/Sequence Diagram.mmd`  
5. `docs/Diagrams/Class Diagram.mmd`  
6. `docs/Diagrams/ERD Diagram.mmd`  
7. `docs/Diagrams/LOGICAL_SCHEMA.md`  
8. `docs/API_SPEC.md`  
9. `laravel-backend/routes/api.php`  
10. `laravel-backend/app/Models/User.php`  
11. `laravel-backend/app/Models/Role.php`  

12. `laravel-backend/app/Http/Controllers/Api/ChatController.php`  
13. `laravel-backend/app/Http/Controllers/Api/PolicyController.php`  
14. `laravel-backend/app/Http/Controllers/Api/AuditEventController.php`  
15. `laravel-backend/app/Http/Controllers/Api/ConversationController.php`  
16. `laravel-backend/app/Http/Controllers/Api/UserController.php`  
17. `laravel-backend/app/Http/Controllers/Api/OrganizationController.php`  
18. `laravel-backend/app/Http/Middleware/EnsureUserHasPermission.php`  
19. `detection_engine/phi_detector.py`  
20. `README.md`  

If `LOGICAL_SCHEMA.md` is unavailable, use `docs/Diagrams/Logical Schema.md` instead and drop `README.md` from the list.

---

## Why previous “Mermaid-only” outputs failed academics

- **Use Case in Mermaid** does not provide UML stick figures, oval use cases, or standard `<<include>>` / `<<extend>>` rendering comparable to coursework marked with Visual Paradigm / PlantUML. **Use PlantUML for Figure 4.1** per your `ACADEMIC_CHECKLIST.md`.
- **Sequence / Class / ERD** in Mermaid are acceptable if they follow the **exact** participant and entity sets from Chapter 4 and match the repo `.mmd` files.

---

## Optional second pass (if output is still wrong)

Paste this follow-up after Claude’s answer:

```text
Revise only what violates Chapter 4 or ACADEMIC_CHECKLIST.md. Keep PlantUML for use case. Do not rename actors or use cases. Show a diff-style list of what you changed and why.
```
