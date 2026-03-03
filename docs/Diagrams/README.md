# ClinGuard – Diagrams (Chapter 4)

**This project uses OOAD (Object-Oriented Analysis and Design) only.** SSAD/SSADM diagrams (Context, Dataflow) are not required; the files `context.mmd` and `dfd-level1.mmd` are left in the folder for reference only and can be ignored or deleted.

**Preview:** Open **`DIAGRAMS_PREVIEW.md`** and use **Markdown: Open Preview** (Ctrl+Shift+V). Install a Mermaid extension if diagrams don’t render.

---

## OOAD diagrams (Analysis & Design)

| Diagram | File (named for submission) | Description |
|---------|----------------------------|-------------|
| Use Case | **`Use Case Diagram.puml`** | PlantUML – stick-figure actors, ovals, <<Subsystem>> boundary, include/extend |
| ERD | **`ERD Diagram.mmd`** | Entities, attributes with exact entity id names (user_id, organization_id, role_id, policy_id, …) to distinguish; verb phrases, cardinality. Aligned with migrations and Logical Schema. |
| Sequence | **`Sequence Diagram.mmd`** | Prompt → Laravel → Detection → RAG → OpenAI → response |
| System Sequence | **`System Sequence Diagram.mmd`** | Actor vs ClinGuard (black box) |
| Activity | **`Activity Diagram.mmd`** | Initial/final, decision, merge, swimlanes |
| Class | **`Class Diagram.mmd`** | Controllers, services, models |
| Logical Schema | **`Logical Schema.md`** | Tables with data types, sizes, precision, keys (aligned with migrations) |

See **`DIAGRAM_INDEX.md`** for the full list and how to view/export. See **`GENERATE_DIAGRAMS.md`** for generating schema and diagrams on any platform (browser, editor, CLI). See **`ACADEMIC_CHECKLIST.md`** for compliance with academic standards.

**Conventions:** *Use Case* — Actors outside system boundary; use cases = goals; associations actor→use case. *ERD* — Entities with PK/FK; relationships as verb phrases; cardinality one-to-many / many-to-one. *Activity* — UML: initial/final state, activity states, decision node with guards, merge, swimlanes.

---

## Academic standards

1. **Use case diagram** — Must use stick-figure actors, ovals for use cases, and a rectangle for the system boundary. Render **`use-case.puml`** with [PlantUML](https://plantuml.com/en/use-case-diagram) (CLI, VS Code extension, or [plantuml.com/plantuml/uml](https://www.plantuml.com/plantuml/uml)) and export to PNG/SVG for submission.
2. **Logical schema** — Must list data type, size/precision/scale, nullability, keys, and default for every column. See `LOGICAL_SCHEMA.md`.
3. **ERD** — Entities, attributes (PK/FK), relationship verb phrases, and cardinality must align with the logical schema and migrations.
4. **Other tools** — For manual tweaks or formal submission, use [PlantUML](https://plantuml.com), [draw.io](https://draw.io), or StarUML. Mermaid sources can be pasted into [Mermaid Live](https://mermaid.live) for export to PNG/SVG.
