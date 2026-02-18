# ClinGuard – OOAD Diagrams (Mermaid Preview)

**This project is OOAD only.** Only Object-Oriented Analysis and Design diagrams are included here (no SSAD/SSADM).

Open this file and use **Markdown: Open Preview** (Ctrl+Shift+V) to render. Use a Mermaid-supported extension if needed.

---

## 1. Use Case Diagram (OOAD – Analysis)

**UML notations:** Actors (top, parallelogram) | Use cases = ovals inside **system boundary** (rectangle) | **Association** = line actor–use case | **<<include>>** / **<<extend>>** = dashed arrows. Layout: **flowchart TB** to reduce line congestion.

```mermaid
flowchart TB
  subgraph Actors[" "]
    direction LR
    Clinician[/Clinician/]
    SecurityAdmin[/Security Admin/]
    SystemAdmin[/System Admin/]
    DetectionSystem[/Detection System/]
    OpenAI[/OpenAI API/]
  end

  subgraph ClinGuard["ClinGuard System"]
    direction TB
    Login(("Login"))
    Register(("Register"))
    Compose(("Compose Clinical Notes"))
    ReviewPHI(("Review PHI Detection"))
    Redact(("Apply Redaction"))
    SubmitAI(("Submit Prompt to AI"))
    ViewRAG(("View RAG Context"))
    Emergency(("Emergency Bypass"))
    ConfigurePolicies(("Configure Policies"))
    ViewAudit(("View Audit Logs"))
    ManageUsers(("Manage Users"))
  end

  Clinician --- Login
  Clinician --- Register
  Clinician --- Compose
  Clinician --- SubmitAI

  SecurityAdmin --- Login
  SecurityAdmin --- ConfigurePolicies
  SecurityAdmin --- ViewAudit

  SystemAdmin --- Login
  SystemAdmin --- ManageUsers
  SystemAdmin --- ViewAudit

  DetectionSystem --- ReviewPHI
  DetectionSystem --- SubmitAI

  OpenAI --- SubmitAI

  Compose -.->|"<<include>>"| ReviewPHI
  Compose -.->|"<<include>>"| Redact
  SubmitAI -.->|"<<include>>"| ViewRAG

  Emergency -.->|"<<extend>>"| SubmitAI
```

---

## 2. Sequence Diagram (OOAD – Analysis)

```mermaid
sequenceDiagram
  participant C as Clinician
  participant F as React Frontend
  participant L as Laravel API
  participant D as Python Detection
  participant R as RAG/Vector DB
  participant O as OpenAI
  C->>F: Enter prompt (with PHI)
  F->>L: POST /api/chat + Bearer
  L->>D: POST /detect text
  D-->>L: spans
  L->>R: RAG query (redacted)
  R-->>L: context chunks
  L->>O: Chat completion (redacted + context)
  O-->>L: response
  L->>L: Save conversation, audit
  L-->>F: response, spans, rag_context
  F-->>C: Show response + PHI highlights + RAG
```

---

## 3. System Sequence Diagram (OOAD – Analysis)

```mermaid
sequenceDiagram
  actor User
  participant ClinGuard as ClinGuard System
  User->>ClinGuard: Login(email, password)
  ClinGuard-->>User: token
  User->>ClinGuard: Submit prompt (with PHI)
  ClinGuard-->>User: PHI spans (for review)
  User->>ClinGuard: Confirm / redact
  User->>ClinGuard: Send (redacted) for AI
  ClinGuard-->>User: AI response + RAG context
```

---

## 4. ERD (Design)

**Standard elements:** *Entities* (rectangles) with *attributes*; *primary key* (PK) and *foreign key* (FK) marked; *relationships* as verb phrases; *cardinality*: one-to-many (||--o{), many-to-one (}o--||). Represents the logical structure of the ClinGuard database.

```mermaid
erDiagram
  ORGANIZATION ||--o{ USER : "employs"
  ORGANIZATION ||--o{ POLICY : "defines"
  ORGANIZATION ||--o{ ALLOWLIST : "maintains"
  ORGANIZATION ||--o{ DETECTION_RULE : "owns"
  ORGANIZATION ||--o{ AUDIT_EVENT : "scoped to"
  ROLE ||--o{ USER : "assigned to"
  USER ||--o{ CONVERSATION : "creates"
  USER ||--o{ AUDIT_EVENT : "generates"

  USER {
    int user_id PK
    int role_id FK
    int organization_id FK
    string name
    string email UK
    string password_hash
    timestamp email_verified_at
    timestamp created_at
    timestamp updated_at
  }

  ORGANIZATION {
    int organization_id PK
    string name
    string registration_number
    string subscription_tier
    string configuration
    timestamp created_at
    timestamp updated_at
  }

  ROLE {
    int role_id PK
    string role_name
    string permissions
    timestamp created_at
    timestamp updated_at
  }

  POLICY {
    int policy_id PK
    int organization_id FK
    string policy_name
    string phi_categories
    string enforcement_action
    float confidence_threshold
    timestamp created_at
    timestamp updated_at
  }

  ALLOWLIST {
    int allowlist_id PK
    int organization_id FK
    string service_name
    string service_domain
    timestamp approval_date
    timestamp created_at
    timestamp updated_at
  }

  DETECTION_RULE {
    int rule_id PK
    int organization_id FK
    string rule_type
    string rule_pattern
    string phi_category
    timestamp created_at
    timestamp updated_at
  }

  AUDIT_EVENT {
    int event_id PK
    int user_id FK
    int organization_id FK
    string event_type
    string detected_categories
    string encrypted_details
    timestamp created_at
    timestamp updated_at
  }

  CONVERSATION {
    int conversation_id PK
    int user_id FK
    string prompt_redacted
    string response_summary
    timestamp created_at
    timestamp updated_at
  }
```

---

## 5. Class Diagram (Design)

```mermaid
classDiagram
  class DetectionController {
    +__invoke(DetectRequest) JsonResponse
  }
  class ChatController {
    -detection DetectionService
    -openai OpenAIService
    +__invoke(ChatRequest) JsonResponse
    -redact(text, spans) string
  }
  class DetectionService {
    +detect(text) array
    +ragQuery(query, topK) array
  }
  class OpenAIService {
    +chat(prompt, ragContext) string
  }
  class User {
    +id
    +name
    +email
    +role_id
    +organization_id
    +createToken()
  }
  class Conversation {
    +user_id
    +prompt_redacted
    +response_summary
  }
  class AuditEvent {
    +user_id
    +event_type
    +detected_categories
  }
  ChatController --> DetectionService
  ChatController --> OpenAIService
  ChatController --> Conversation
  ChatController --> AuditEvent
  DetectionController --> DetectionService
  Conversation --> User
  AuditEvent --> User
```

---

## 6. Activity Diagram (OOAD – UML)

**Standard UML notations:** *Initial state* (filled circle), *Activity state* (rounded rectangle), *Control flow* (arrows), *Decision node* (diamond) with *guards* [Yes]/[No], *Merge* (multiple flows into one activity), *Swimlanes* (User/Frontend and Laravel API), *Final state* (circle within circle). Shows the workflow for submitting a prompt with PHI detection and AI response.

```mermaid
flowchart TD
  Start((Start))
  End1((End))

  subgraph Swimlane_User["Swimlane: User / Frontend"]
    A1[User enters clinical prompt]
    A2[Send prompt to API with auth token]
    A14[Receive response and spans]
    A15[Display response and PHI highlights to user]
  end

  subgraph Swimlane_Backend["Swimlane: Laravel API"]
    A3[Receive request and validate token]
    A4[Invoke Python Detection Engine]
    A5[Receive PHI spans]
    Decision{PHI detected?}
    A6[Redact detected spans in prompt]
    A7[Use original prompt as-is]
    A8[Query RAG with prompt]
    A9[Receive RAG context]
    A10[Augment prompt with context]
    A11[Call OpenAI API]
    A12[Receive AI response]
    A13[Save conversation and audit event]
    A13b[Return response to frontend]
  end

  Start --> A1
  A1 --> A2
  A2 --> A3
  A3 --> A4
  A4 --> A5
  A5 --> Decision
  Decision -->|Yes| A6
  Decision -->|No| A7
  A6 --> A8
  A7 --> A8
  A8 --> A9
  A9 --> A10
  A10 --> A11
  A11 --> A12
  A12 --> A13
  A13 --> A13b
  A13b --> A14
  A14 --> A15
  A15 --> End1
```

---

*OOAD only. Source `.mmd` files are in this folder. Logical schema: `LOGICAL_SCHEMA.md`. SSAD files (`context.mmd`, `dfd-level1.mmd`) are not part of this project and can be ignored or removed.*
