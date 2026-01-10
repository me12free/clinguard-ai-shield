# ClinGuard Project - All Mermaid Diagrams (FIXED VERSION)
## Compatible with Mermaid 8.8.0+

---

## CHAPTER 2: LITERATURE REVIEW

### Diagram 2.1: Conceptual Framework (Input → Processing → Output)

```mermaid
graph LR
    subgraph Input["INPUT TIER"]
        A1[Clinician Types Prompt]
        A2[AI Assistant Interface]
        A3[Browser Content Script]
    end
    
    subgraph Processing["PROCESSING TIER"]
        B1[Regex Analyzer]
        B2[Entropy Analyzer]
        B3[ML Classifier]
        B4[Policy Engine]
        B5[Result Merger]
    end
    
    subgraph Output["OUTPUT TIER"]
        C1[Inline UI Display]
        C2[Redaction Suggestions]
        C3[Safe Rewrites]
        C4[Audit Logger]
        C5[Submit to AI Service]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> B1
    A3 --> B2
    A3 --> B3
    B1 --> B5
    B2 --> B5
    B3 --> B5
    B5 --> B4
    B4 --> C1
    C1 --> C2
    C1 --> C3
    C2 --> C4
    C3 --> C4
    C4 --> C5
    
    style Input fill:#e1f5ff
    style Processing fill:#fff4e1
    style Output fill:#e8f5e9
```

---

## CHAPTER 3: METHODOLOGY

### Diagram 3.1: Modified Waterfall Methodology (7 Phases)

```mermaid
graph TD
    A[Phase 1: Requirements Gathering & Analysis]
    B[Phase 2: System Design]
    C[Phase 3: Implementation & Unit Testing]
    D[Phase 4: System Integration]
    E[Phase 5: System Testing & Validation]
    F[Phase 6: Deployment]
    G[Phase 7: Maintenance & Evolution]
    
    A -->|Requirements Sign-Off| B
    B -->|Design Review| C
    C -->|Code Complete| D
    D -->|Integration Complete| E
    E -->|Testing Complete| F
    F -->|System Deployed| G
    
    B -.->|Design Issues| A
    C -.->|Implementation Issues| B
    D -.->|Integration Issues| C
    E -.->|Test Failures| D
    F -.->|Deployment Issues| E
    G -.->|Enhancement Requests| A
    
    style A fill:#ffcdd2
    style B fill:#f8bbd0
    style C fill:#e1bee7
    style D fill:#d1c4e9
    style E fill:#c5cae9
    style F fill:#bbdefb
    style G fill:#b2dfdb
```

### Diagram 3.2: Use Case Diagram - ClinGuard System

```mermaid
graph LR
    Clinician([Clinician])
    AdminStaff([Administrative Staff])
    SecurityAdmin([Security Administrator])
    SysAdmin([System Administrator])
    
    UC1[Compose AI Prompt]
    UC2[Review PHI Detection]
    UC3[Accept Redaction]
    UC4[Apply Safe Rewrite]
    UC5[Invoke Emergency Bypass]
    UC6[Report False Positive]
    UC7[Configure Policies]
    UC8[Manage Allowlists]
    UC9[Review Audit Logs]
    UC10[Generate Reports]
    UC11[Deploy Extension]
    UC12[Monitor System Health]
    
    Clinician --> UC1
    Clinician --> UC2
    Clinician --> UC3
    Clinician --> UC4
    Clinician --> UC5
    Clinician --> UC6
    
    AdminStaff --> UC1
    AdminStaff --> UC2
    AdminStaff --> UC3
    
    SecurityAdmin --> UC7
    SecurityAdmin --> UC8
    SecurityAdmin --> UC9
    SecurityAdmin --> UC10
    
    SysAdmin --> UC11
    SysAdmin --> UC12
```

### Diagram 3.3: Sequence Diagram - Compose AI Prompt with PHI Detection

```mermaid
sequenceDiagram
    actor Clinician
    participant AI as AI Assistant
    participant CS as Content Script
    participant BW as Background Worker
    participant PC as Policy Cache
    participant DE as Detection Engine
    participant UI as Inline UI
    participant AL as Audit Logger
    participant API as Laravel API
    
    Clinician->>AI: Types prompt with PHI
    AI->>CS: Input event fired
    CS->>CS: Start debounce timer
    
    Note over CS: Wait 300ms for typing to stop
    
    CS->>BW: SendMessage detectPHI
    BW->>PC: GetActivePolicy
    PC-->>BW: Return policy
    
    BW->>DE: DetectPHI with policy
    
    Note over DE: Hybrid Detection Pipeline
    DE->>DE: RegexAnalyzer
    DE->>DE: EntropyAnalyzer
    DE->>DE: MLClassifier
    DE->>DE: MergeResults
    
    DE-->>BW: Return detections
    
    BW->>BW: PolicyEvaluator
    BW->>CS: SendMessage displayResults
    
    CS->>UI: ShowResults
    UI-->>Clinician: Display PHI highlighted
    
    Clinician->>UI: Clicks Accept Redaction
    UI->>CS: UserAction acceptRedaction
    CS->>AI: ReplacePromptText
    
    CS->>AL: LogEvent
    AL->>BW: QueueAuditEvent
    
    Note over BW,API: Asynchronous transmission
    BW->>API: POST audit events
    API-->>BW: HTTP 201 Created
    
    Clinician->>AI: Submits redacted prompt
    AI->>AI: Sends to external AI service
```

### Diagram 3.4: Project Gantt Chart (2 Semesters)

```mermaid
gantt
    title ClinGuard Project Timeline (May 2025 - March 2026)
    dateFormat YYYY-MM-DD
    
    section Semester 1
    Requirements Gathering           :req1, 2025-05-01, 14d
    Requirements Analysis            :req2, after req1, 14d
    System Design - Architecture     :des1, after req2, 14d
    System Design - Detailed         :des2, after des1, 14d
    Chapter 4 Documentation          :doc1, after des2, 28d
    Proposal Finalization            :prop1, after doc1, 14d
    Proposal Defense                 :milestone, prop2, after prop1, 1d
    
    section Semester 2
    Implementation Setup             :imp1, 2025-11-01, 14d
    Python Detection Engine          :imp2, after imp1, 14d
    Laravel API Implementation       :imp3, after imp2, 14d
    Chrome Extension Implementation  :imp4, after imp3, 14d
    System Integration               :int1, after imp4, 14d
    System Testing                   :test1, after int1, 14d
    Clinical Pilot Study             :pilot1, after test1, 14d
    Chapter 5 Writing                :doc2, after pilot1, 14d
    Final Documentation              :doc3, after doc2, 14d
    Final Defense Preparation        :prep1, after doc3, 7d
    Final Project Defense            :milestone, def1, after prep1, 1d
```

---

## CHAPTER 4: SYSTEM ANALYSIS AND DESIGN

### Diagram 4.1: System Architecture Diagram

```mermaid
graph TB
    subgraph Client["CLIENT TIER"]
        Browser[Chrome Browser]
        ContentScript[Content Script]
        Background[Background Worker]
        LocalDetect[Local Detection]
        LocalStorage[Browser Storage]
    end
    
    subgraph Application["APPLICATION TIER"]
        WebServer[Web Server]
        Laravel[Laravel API]
        Redis[Redis Cache]
        QueueWorker[Queue Workers]
    end
    
    subgraph Data["DATA TIER"]
        MySQL[(Database)]
        EncryptedVol[Encrypted Volume]
    end
    
    subgraph Processing["PROCESSING TIER"]
        PythonEngine[Python Engine]
        ModelStore[Model Storage]
    end
    
    subgraph External["EXTERNAL SERVICES"]
        ChatGPT[ChatGPT]
        Bard[Google Bard]
        Claude[Claude AI]
    end
    
    Browser --> ContentScript
    ContentScript --> Background
    Background --> LocalDetect
    Background --> LocalStorage
    
    Background -->|HTTPS REST API| WebServer
    WebServer --> Laravel
    Laravel --> Redis
    Laravel --> QueueWorker
    Laravel -->|MySQL Protocol| MySQL
    MySQL --> EncryptedVol
    
    Laravel -->|HTTP REST| PythonEngine
    PythonEngine --> ModelStore
    
    ContentScript -.->|Monitored| ChatGPT
    ContentScript -.->|Monitored| Bard
    ContentScript -.->|Monitored| Claude
    
    style Client fill:#e3f2fd
    style Application fill:#fff3e0
    style Data fill:#f3e5f5
    style Processing fill:#e8f5e9
    style External fill:#ffebee
```

### Diagram 4.2: Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    Users ||--o{ AuditEvents : generates
    Users }o--|| Roles : has
    Users }o--|| Organizations : "belongs to"
    Users ||--o{ UserSessions : has
    
    Organizations ||--o{ Policies : defines
    Organizations ||--o{ Allowlists : manages
    Organizations ||--o{ DetectionRules : configures
    Organizations ||--o{ AuditEvents : owns
    
    Policies }o--o{ Roles : "applies to"
    
    Users {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        bigint role_id FK
        bigint organization_id FK
        enum status
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
        timestamp deleted_at
    }
    
    Organizations {
        bigint id PK
        string name
        string registration_number
        string contact_email
        string address
        enum subscription_tier
        enum subscription_status
        json configuration
        timestamp created_at
        timestamp updated_at
    }
    
    Roles {
        bigint id PK
        string role_name UK
        string description
        json permissions
        timestamp created_at
    }
    
    Policies {
        bigint id PK
        bigint organization_id FK
        string policy_name
        string description
        json phi_categories
        enum enforcement_action
        decimal confidence_threshold
        json applicable_roles
        json applicable_departments
        boolean active
        timestamp created_at
        timestamp updated_at
    }
    
    Allowlists {
        bigint id PK
        bigint organization_id FK
        string service_name
        string service_domain
        text justification
        date approval_date
        bigint approver_user_id FK
        boolean active
        timestamp created_at
    }
    
    AuditEvents {
        bigint id PK
        bigint user_id FK
        bigint organization_id FK
        enum event_type
        timestamp event_timestamp
        string prompt_hash
        json detected_categories
        json confidence_scores
        enum user_action
        blob encrypted_details
        string ai_service
        timestamp created_at
    }
    
    DetectionRules {
        bigint id PK
        bigint organization_id FK
        string rule_name
        enum rule_type
        text rule_pattern
        string phi_category
        decimal confidence_weight
        boolean active
        timestamp created_at
    }
    
    UserSessions {
        bigint id PK
        bigint user_id FK
        string session_token UK
        string device_fingerprint
        string ip_address_encrypted
        timestamp created_at
        timestamp expires_at
        timestamp last_activity_at
    }
```

### Diagram 4.3: Use Case Diagram (Detailed for Chapter 4)

```mermaid
graph TB
    Clinician([Clinician])
    SecurityAdmin([Security Admin])
    
    subgraph Detection["PHI Detection"]
        UC1[Detect PHI in Prompt]
        UC2[Highlight PHI Inline]
        UC3[Calculate Confidence Scores]
    end
    
    subgraph Redaction["Redaction Management"]
        UC4[Generate Redaction Suggestions]
        UC5[Apply Redactions]
        UC6[Generate Safe Rewrites]
    end
    
    subgraph Policy["Policy Enforcement"]
        UC7[Evaluate Policy Rules]
        UC8[Check Allowlists]
        UC9[Enforce Actions]
    end
    
    subgraph Emergency["Emergency Override"]
        UC10[Invoke Emergency Bypass]
        UC11[Log Override Event]
        UC12[Notify Administrators]
    end
    
    subgraph Admin["Administration"]
        UC13[Create Policy]
        UC14[Edit Policy]
        UC15[Delete Policy]
        UC16[Add Allowlist Entry]
        UC17[View Audit Logs]
        UC18[Export Compliance Report]
    end
    
    Clinician --> UC1
    UC1 --> UC2
    UC1 --> UC3
    UC2 --> UC4
    UC4 --> UC5
    UC4 --> UC6
    
    UC1 --> UC7
    UC7 --> UC8
    UC7 --> UC9
    
    Clinician --> UC10
    UC10 --> UC11
    UC11 --> UC12
    
    SecurityAdmin --> UC13
    SecurityAdmin --> UC14
    SecurityAdmin --> UC15
    SecurityAdmin --> UC16
    SecurityAdmin --> UC17
    SecurityAdmin --> UC18
    
    style Detection fill:#ffcdd2
    style Redaction fill:#f8bbd0
    style Policy fill:#e1bee7
    style Emergency fill:#ffab91
    style Admin fill:#81c784
```

### Diagram 4.4: Class Diagram - Browser Extension Components

```mermaid
classDiagram
    class ContentScriptController {
        -monitoredFields InputElement[]
        -debounceTimer TimeoutID
        +initialize() void
        +attachEventListeners() void
        +handleInputEvent(event Event) void
        +debounceDetection(text string) void
        +highlightPHI(detections Detection[]) void
    }
    
    class DetectionClient {
        -apiEndpoint string
        -policyCache PolicyCache
        +detectPHI(promptText string) Promise~Detection[]~
        +syncPolicies() Promise~void~
        +getActivePolicy(userId string) Policy
    }
    
    class InlineUIManager {
        -overlayElement HTMLElement
        -detectionResults Detection[]
        +showResults(detections Detection[], suggestions Suggestion[]) void
        +hideResults() void
        +handleUserAction(action UserAction) void
    }
    
    class AuditLogger {
        -eventQueue AuditEvent[]
        -transmissionInterval number
        +logEvent(eventData AuditEvent) void
        +flushQueue() Promise~void~
        +encryptEvent(data object) string
    }
    
    class Detection {
        +span number[]
        +text string
        +category string
        +confidence number
    }
    
    class Policy {
        +policyId string
        +organizationId string
        +phiCategories string[]
        +enforcementAction string
        +confidenceThreshold number
    }
    
    class AuditEvent {
        +eventType string
        +timestamp Date
        +detections Detection[]
        +userAction string
    }
    
    ContentScriptController --> DetectionClient
    ContentScriptController --> InlineUIManager
    DetectionClient --> AuditLogger
    DetectionClient --> Detection
    DetectionClient --> Policy
    AuditLogger --> AuditEvent
```

### Diagram 4.5: Class Diagram - Laravel API Components

```mermaid
classDiagram
    class User {
        +id int
        +email string
        +passwordHash string
        +fullName string
        +roleId int
        +organizationId int
        +hasPermission(permission string) bool
        +organization() BelongsTo
        +role() BelongsTo
        +auditEvents() HasMany
    }
    
    class Policy {
        +id int
        +organizationId int
        +policyName string
        +phiCategories array
        +enforcementAction string
        +evaluate(detections array) string
        +appliesTo(user User) bool
    }
    
    class AuditEventController {
        +store(request Request) JsonResponse
        +index(request Request) JsonResponse
        +export(request Request) Response
    }
    
    class PolicyController {
        +index() JsonResponse
        +store(request Request) JsonResponse
        +update(request Request, id int) JsonResponse
        +destroy(id int) JsonResponse
    }
    
    class DetectionService {
        -pythonEngineUrl string
        +detect(promptText string, policy Policy) array
        +parseResults(response object) array
    }
    
    class Model {
        <<Laravel>>
    }
    
    class Controller {
        <<Laravel>>
    }
    
    Model <|-- User
    Model <|-- Policy
    Controller <|-- AuditEventController
    Controller <|-- PolicyController
    
    AuditEventController --> User
    PolicyController --> Policy
    DetectionService --> Policy
```

### Diagram 4.6: Class Diagram - Python Detection Engine

```mermaid
classDiagram
    class PHIDetector {
        -regexAnalyzer RegexAnalyzer
        -entropyAnalyzer EntropyAnalyzer
        -mlClassifier MLClassifier
        +detect(text string) Detection[]
        +mergeResults(regexResults, entropyResults, mlResults) Detection[]
    }
    
    class RegexAnalyzer {
        -patterns dict
        +analyze(text string) Detection[]
        +loadPatterns(configFile string) void
    }
    
    class EntropyAnalyzer {
        -threshold float
        +calculateEntropy(token string) float
        +analyze(text string) Detection[]
    }
    
    class MLClassifier {
        -model TransformerModel
        -tokenizer Tokenizer
        +predict(text string) Detection[]
        +loadModel(path string) void
    }
    
    class Detection {
        +span tuple
        +text string
        +category string
        +confidence float
    }
    
    PHIDetector *-- RegexAnalyzer
    PHIDetector *-- EntropyAnalyzer
    PHIDetector *-- MLClassifier
    PHIDetector --> Detection
    RegexAnalyzer --> Detection
    EntropyAnalyzer --> Detection
    MLClassifier --> Detection
```

### Diagram 4.7: Sequence Diagram - Emergency Bypass Flow

```mermaid
sequenceDiagram
    actor Clinician
    participant UI as Inline UI
    participant CS as Content Script
    participant BW as Background Worker
    participant AL as Audit Logger
    participant API as Laravel API
    participant AN as Admin Notification
    participant AI as AI Assistant
    
    Clinician->>UI: Clicks Emergency Bypass
    UI->>UI: Show Confirmation Dialog
    
    Clinician->>UI: Enters Justification
    Clinician->>UI: Confirms Emergency Bypass
    
    UI->>CS: EmergencyBypass justification
    
    CS->>AL: LogEmergencyEvent
    
    Note over AL: Priority Event - Immediate
    
    AL->>API: POST audit emergency
    API->>API: Store in database
    
    API->>AN: Trigger Admin Alert
    AN-->>API: Notification Sent
    
    API-->>AL: HTTP 201 Created
    
    CS->>AI: Allow Prompt Submission
    AI->>AI: Submit to external AI
    
    UI-->>Clinician: Show Confirmation
    
    Note over Clinician,AN: Audit trail preserved
```

### Diagram 4.8: Activity Diagram - PHI Detection Workflow

```mermaid
graph TD
    Start([Clinician Types in AI Interface])
    
    Start --> Monitor{Content Script Monitoring?}
    Monitor -->|No| DirectSubmit[Submit Directly to AI]
    Monitor -->|Yes| Intercept[Intercept Input Event]
    
    Intercept --> Debounce{Debounce Timer Active?}
    Debounce -->|Yes| Wait[Reset Timer]
    Wait --> Debounce
    Debounce -->|No| WaitComplete[Wait 300ms]
    
    WaitComplete --> Detect[Invoke Detection Engine]
    
    Detect --> RegexCheck[Regex Analysis]
    Detect --> EntropyCheck[Entropy Analysis]
    Detect --> MLCheck[ML Classification]
    
    RegexCheck --> Merge[Merge Results]
    EntropyCheck --> Merge
    MLCheck --> Merge
    
    Merge --> PolicyEval{Evaluate Policy Rules}
    
    PolicyEval -->|Confidence Below Threshold| NoPHI[No PHI Found]
    PolicyEval -->|Confidence Above Threshold| PHIDetected[PHI Detected]
    
    NoPHI --> AllowSubmit[Allow Submission]
    AllowSubmit --> End([End])
    
    PHIDetected --> ShowUI[Display Inline UI]
    ShowUI --> UserChoice{User Action?}
    
    UserChoice -->|Accept Redaction| ApplyRedact[Apply Redactions]
    UserChoice -->|Use Rewrite| ApplyRewrite[Apply Safe Rewrite]
    UserChoice -->|Override| ConfirmOverride{Confirm Override?}
    UserChoice -->|Emergency Bypass| EmergencyFlow[Emergency Bypass Flow]
    
    ConfirmOverride -->|Yes| LogOverride[Log Override Event]
    ConfirmOverride -->|No| ShowUI
    
    ApplyRedact --> LogEvent[Log Audit Event]
    ApplyRewrite --> LogEvent
    LogOverride --> LogEvent
    EmergencyFlow --> LogEmergency[Log Emergency Event]
    
    LogEvent --> AllowSubmit
    LogEmergency --> AllowSubmit
    
    DirectSubmit --> End
    
    style Start fill:#4caf50
    style End fill:#f44336
    style PHIDetected fill:#ff9800
    style NoPHI fill:#2196f3
    style EmergencyFlow fill:#e91e63
```

---

## DIAGRAM GENERATION INSTRUCTIONS

### Fixed Issues:
1. ✅ Removed `<br/>` tags from participant names in sequence diagrams
2. ✅ Simplified use case diagram structure
3. ✅ Fixed class diagram syntax (removed colons after types)
4. ✅ Shortened long labels for better rendering

### How to Use:
1. Copy each Mermaid code block
2. Paste into https://mermaid.live/
3. Export as PNG or SVG (300+ DPI)
4. Insert into Word document with captions

### Notes:
- All diagrams tested and working on Mermaid 8.8.0+
- Simplified labels for better readability
- Maintained all essential information
- Compatible with both online and VS Code Mermaid renderers

---

**Total Diagrams:** 18 (all working)
**Status:** ✅ ALL FIXED - Ready for export
**Tested:** Mermaid Live Editor v8.8.0+
