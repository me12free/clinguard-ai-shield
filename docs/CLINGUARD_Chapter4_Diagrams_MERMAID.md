# ClinGuard — Chapter 4 diagram code (PlantUML + Mermaid)

**Project:** ClinGuard (PHI detection, Laravel API, React frontend, Python detection engine).  
**Source:** `docs/Chapter 4 System Analysis and Design.md` (your project — not the 149604 hospitality reference doc).

**UML use case diagrams** need **oval** use cases, a **rectangular system boundary**, **stick-figure actors**, and proper **include** / **extend** notation. For **coursework / strict UML**, use **PlantUML** below — the same source lives in `docs/Diagrams/Use Case Diagram.puml`.

**Do not paste PlantUML into Mermaid Chart or mermaid.live.** Those tools only understand **Mermaid**. If you paste `@startuml … @enduml`, you get `UnknownDiagramError` / “No diagram type detected” — that is expected. Use [PlantUML online](https://www.plantuml.com/plantuml/uml) for Figure 4.1 PlantUML. If your workflow is **Mermaid-only**, use **Figure 4.1b** (stadium-shaped nodes as oval-like use cases; not full UML, but valid Mermaid).

For Figures 4.2–4.4, paste Mermaid into [mermaid.live](https://mermaid.live) or Mermaid Chart. Start from the first line (`sequenceDiagram`, `classDiagram`, or `erDiagram`). Do **not** duplicate the ` ```mermaid ` line if the tool adds it.

---

## Figure 4.1 — Use case diagram (PlantUML — true UML)

Render with [PlantUML online](https://www.plantuml.com/plantuml/uml), VS Code PlantUML extension, or CLI. Copy from `@startuml` through `@enduml`.

```plantuml
@startuml ClinGuard Use Case Diagram
' Neat layout: human actors LEFT, use cases in center, service actors RIGHT (all outside system).
' Left: Actor -- UseCase. Right: UseCase --- Actor (use case first + longer line = actor on right).
' Render: PlantUML CLI, VS Code PlantUML, or https://www.plantuml.com/plantuml/uml

left to right direction
skinparam packageStyle rectangle
skinparam Padding 12
skinparam usecasePadding 12
skinparam ActorPadding 25

' === All actors (left-side defined first; right-side referenced in rectangle links) ===
actor "Clinician" as Clinician
actor "Security Admin" as SecurityAdmin
actor "System Admin" as SystemAdmin
actor "Detection System" <<Service>> as DetectionSystem
actor "OpenAI API" <<Service>> as OpenAI

' === System boundary: use cases + all associations ===
rectangle "<<Subsystem>> ClinGuard System" {
  left to right direction

  (Login) as UC_Login
  (Register) as UC_Register
  (Compose Clinical Notes) as UC_Compose
  (Review PHI Detection) as UC_ReviewPHI
  (Apply Redaction) as UC_Redact
  (Submit Prompt to AI) as UC_SubmitAI
  (View RAG Context) as UC_ViewRAG
  (Emergency Bypass) as UC_Emergency
  (Configure Policies) as UC_ConfigurePolicies
  (View Audit Logs) as UC_ViewAudit
  (Manage Users) as UC_ManageUsers

  ' Left: actor first → actor on left
  Clinician -- UC_Login
  Clinician -- UC_Register
  Clinician -- UC_Compose
  Clinician -- UC_SubmitAI
  SecurityAdmin -- UC_Login
  SecurityAdmin -- UC_ConfigurePolicies
  SecurityAdmin -- UC_ViewAudit
  SystemAdmin -- UC_Login
  SystemAdmin -- UC_ManageUsers
  SystemAdmin -- UC_ViewAudit

  ' Right: use case first + --- → actor on right (outside boundary)
  UC_ReviewPHI --- DetectionSystem
  UC_SubmitAI --- DetectionSystem
  UC_SubmitAI --- OpenAI

  UC_Compose ..> UC_ReviewPHI : <<include>>
  UC_Compose ..> UC_Redact : <<include>>
  UC_SubmitAI ..> UC_ViewRAG : <<include>>
  UC_Emergency ..> UC_SubmitAI : <<extend>>
}

@enduml
```

---

## Figure 4.1b — Use case view (Mermaid only — for Mermaid Chart / mermaid.live)

**Not strict UML** (no stick figures; use cases use **stadium** shape `([label])` as the closest Mermaid equivalent to ovals). Paste the **entire** block including `flowchart TB` into Mermaid Chart or mermaid.live.

```mermaid
flowchart TB
  subgraph boundary["ClinGuard System"]
    direction TB
    UC_Login([Login])
    UC_Reg([Register])
    UC_Compose([Compose Clinical Notes])
    UC_Review([Review PHI Detection])
    UC_Redact([Apply Redaction])
    UC_Submit([Submit Prompt to AI])
    UC_RAG([View RAG Context])
    UC_Bypass([Emergency Bypass])
    UC_Pol([Configure Policies])
    UC_Audit([View Audit Logs])
    UC_Users([Manage Users])
  end

  Clinician[Clinician]
  Sec[Security Admin]
  Sys[System Admin]
  Det[Detection System]
  OAI[OpenAI API]

  Clinician --- UC_Login
  Clinician --- UC_Reg
  Clinician --- UC_Compose
  Clinician --- UC_Submit
  Sec --- UC_Login
  Sec --- UC_Pol
  Sec --- UC_Audit
  Sys --- UC_Login
  Sys --- UC_Users
  Sys --- UC_Audit

  UC_Review --- Det
  UC_Submit --- Det
  UC_Submit --- OAI

  UC_Compose -.->|include| UC_Review
  UC_Compose -.->|include| UC_Redact
  UC_Submit -.->|include| UC_RAG
  UC_Bypass -.->|extend| UC_Submit
```

---

## Figure 4.2 — Sequence diagram (chat flow)

```mermaid
sequenceDiagram
  participant C as Clinician
  participant F as React Frontend
  participant L as Laravel API
  participant D as Python Detection Engine
  participant R as RAG Vector DB
  participant O as OpenAI API
  participant DB as Database

  C->>F: Enter clinical prompt
  F->>L: POST /api/chat Bearer token
  L->>L: Validate ChatRequest
  L->>L: Auth user
  L->>D: POST detect text
  alt detection OK
    D-->>L: PHI spans
  else detection fails
    D-->>L: error
    L->>L: spans empty
  end
  L->>L: Redact prompt using spans
  L->>R: RAG query
  alt RAG OK
    R-->>L: context chunks
  else RAG fails
    R-->>L: error
    L->>L: empty context
  end
  L->>O: Chat completion redacted plus context
  alt OpenAI OK
    O-->>L: model text
  else OpenAI fails
    O-->>L: error
  end
  L->>DB: Save conversation
  L->>DB: Save audit event
  L-->>F: 200 response
  F-->>C: Show response and highlights

  Note over C, DB: Optional POST /api/detect only
  C->>F: PHI check only
  F->>L: POST /api/detect
  L->>D: detect
  D-->>L: spans
  L-->>F: spans
```

---

## Figure 4.3 — Class diagram (analysis view)

```mermaid
classDiagram
  direction TB
  class UserInterface {
    <<frontend>>
    +login()
    +submitPrompt()
  }
  class PHIDetection {
    <<frontend>>
    +detectPHI()
    +highlightPHI()
  }
  class PromptEditor {
    <<frontend>>
    +edit()
  }
  class BaseController {
    <<base>>
  }
  class UserController {
    <<backend>>
    +register()
    +profile()
  }
  class PolicyManager {
    <<backend>>
    +evaluatePolicy()
  }
  class OpenAIService {
    <<backend>>
    +chat()
  }
  class PHIDetectionService {
    <<backend>>
    +detect()
  }
  class RegexAnalyzer {
    <<python>>
    +match()
  }
  class EntropyAnalyzer {
    <<python>>
    +score()
  }
  class MLClassifier {
    <<python>>
    +predict()
  }
  class PHIDetector {
    <<python>>
    +run()
  }

  UserInterface --> PHIDetection
  UserInterface --> PromptEditor
  UserController --|> BaseController
  PolicyManager --|> BaseController
  PHIDetectionService --> RegexAnalyzer
  PHIDetectionService --> EntropyAnalyzer
  PHIDetectionService --> MLClassifier
  PHIDetectionService --> PHIDetector
```

---

## Figure 4.4 — ERD (ClinGuard logical model)

Entity names avoid reserved word USER — APP_USER maps to `users` table.

```mermaid
erDiagram
  ORGANIZATION ||--o{ APP_USER : employs
  ORGANIZATION ||--o{ POLICY : defines
  ORGANIZATION ||--o{ ALLOWLIST : maintains
  ORGANIZATION ||--o{ DETECTION_RULE : owns
  ORGANIZATION ||--o{ AUDIT_EVENT : scopes
  ROLE ||--o{ APP_USER : assigned
  APP_USER ||--o{ CONVERSATION : creates
  APP_USER ||--o{ AUDIT_EVENT : generates

  APP_USER {
    int user_id PK
    int role_id FK
    int organization_id FK
    string name
    string email
    string password
    timestamp created_at
  }

  ORGANIZATION {
    int organization_id PK
    string name
    string registration_number
    timestamp created_at
  }

  ROLE {
    int role_id PK
    string role_name
    string permissions
  }

  POLICY {
    int policy_id PK
    int organization_id FK
    string policy_name
    float confidence_threshold
  }

  ALLOWLIST {
    int allowlist_id PK
    int organization_id FK
    string service_name
  }

  DETECTION_RULE {
    int detection_rule_id PK
    int organization_id FK
    string rule_type
    string phi_category
  }

  AUDIT_EVENT {
    int audit_event_id PK
    int user_id FK
    int organization_id FK
    string event_type
    timestamp created_at
  }

  CONVERSATION {
    int conversation_id PK
    int user_id FK
    string prompt_redacted
    string response_summary
    timestamp created_at
  }
```

---

## Figure 4.5 — Logical schema (Markdown tables)

Copy into Word or your report. Full column detail: see `docs/Diagrams/LOGICAL_SCHEMA.md`.

| Table | Primary key | Foreign keys | Purpose |
|-------|-------------|----------------|---------|
| users | user_id | role_id, organization_id | App users |
| organizations | organization_id | — | Tenants |
| roles | role_id | — | Roles and permissions |
| policies | policy_id | organization_id | PHI policies |
| allowlists | allowlist_id | organization_id | Allowed services |
| detection_rules | detection_rule_id | organization_id | Detection rules |
| audit_events | audit_event_id | user_id, organization_id | Audit log |
| conversations | conversation_id | user_id | Chat storage |

---

## Wrong file?

If you opened `REFERENCE_149604_Chapter4_Diagrams_MERMAID.md`, that file is **not** ClinGuard — it was built from another student’s Word doc by mistake. **Use this file (`CLINGUARD_Chapter4_Diagrams_MERMAID.md`) for your ClinGuard submission.**
