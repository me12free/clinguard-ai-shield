# ClinGuard – Diagrams (Chapter 4)

**This project uses OOAD (Object-Oriented Analysis and Design) only.** SSAD/SSADM diagrams (Context, Dataflow) are not required; the files `context.mmd` and `dfd-level1.mmd` are left in the folder for reference only and can be ignored or deleted.

**Preview:** Open **`DIAGRAMS_PREVIEW.md`** and use **Markdown: Open Preview** (Ctrl+Shift+V). Install a Mermaid extension if diagrams don’t render.

---

## OOAD diagrams (Analysis & Design)

| Diagram | File | Description |
|---------|------|-------------|
| Use Case | `use-case.mmd` | Actors, system boundary, use cases (goals), associations |
| Sequence | `sequence.mmd` | Prompt → Laravel → Detection → RAG → OpenAI → response |
| System Sequence | `system-sequence.mmd` | Actor vs ClinGuard (black box) |
| ERD | `erd.mmd` | Entities, attributes (PK/FK), relationships, cardinality |
| Logical DB Schema | `LOGICAL_SCHEMA.md` | Table format – columns, types, keys (aligned with migrations) |
| Class | `class.mmd` | Controllers, services, models |
| Activity (UML) | `activity.mmd` | Initial/final state, activities, decision with guards, merge, swimlanes |

**Conventions:** *Use Case* — Actors outside system boundary; use cases = goals; associations actor→use case. *ERD* — Entities with PK/FK; relationships as verb phrases; cardinality one-to-many / many-to-one. *Activity* — UML: initial/final state, activity states, decision node with guards, merge, swimlanes.

---

*Mermaid sources can be pasted into [Mermaid Live](https://mermaid.live) or opened in the editor for export to PNG/SVG. Use StarUML or Visual Paradigm for formal submission if required.*
