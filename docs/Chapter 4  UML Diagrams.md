# Chapter 4: System Analysis and Design
## 4.3 System Analysis Diagrams (OOAD Approach)

### 4.3.1 Use Case Diagram

```mermaid
graph LR

    subgraph CG["ClinGuard System"]
        UC1(Authenticate)
        UC2(Submit Prompt)
        UC3(Detect PHI)
        UC4(Redact Content)
        UC5(Generate Response)
        UC6(Retrieve Knowledge)
        UC7(Manage Policies)
        UC8(Generate Reports)
        UC9(Emergency Bypass)
    end

    Clinician[Clinician]
    Administrator[Administrator]
    SecurityOfficer[Security Officer]

    Clinician --- UC1
    Clinician --- UC2
    Clinician --- UC3
    Clinician --- UC4
    Clinician --- UC5
    Clinician --- UC6
    Clinician --- UC9

    Administrator --- UC1
    Administrator --- UC7
    Administrator --- UC8

    SecurityOfficer --- UC1
    SecurityOfficer --- UC8

    UC2 ..> UC3
    UC3 ..> UC4
    UC4 ..> UC5
    UC5 ..> UC6
    UC1 ..> UC7
    UC1 ..> UC8

    style Clinician fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style Administrator fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style SecurityOfficer fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
```

### 4.3.2 Sequence Diagram

```mermaid
sequenceDiagram
    participant Clinician
    participant ReactFrontend
    participant AuthController
    participant PHIDetectionService
    participant PolicyManager
    participant RAGService
    participant OpenAIGateway
    participant AuditLogger
    participant Database
    
    Clinician->>ReactFrontend: Submit Prompt
    ReactFrontend->>AuthController: Validate Session
    AuthController->>Database: Check User Session
    Database-->>AuthController: Session Valid
    AuthController-->>ReactFrontend: Authentication Confirmed
    
    ReactFrontend->>PHIDetectionService: Analyze Text for PHI
    PHIDetectionService->>PolicyManager: Get Detection Rules
    PolicyManager->>Database: Fetch Active Policies
    Database-->>PolicyManager: Policy Rules
    PolicyManager-->>PHIDetectionService: Detection Thresholds
    
    PHIDetectionService->>PHIDetectionService: Regex Analysis
    PHIDetectionService->>PHIDetectionService: Entropy Analysis
    PHIDetectionService->>PHIDetectionService: ML Classification
    PHIDetectionService->>PHIDetectionService: Aggregate Results
    
    PHIDetectionService->>AuditLogger: Log Detection Event
    AuditLogger->>Database: Store Audit Record
    
    PHIDetectionService-->>ReactFrontend: PHI Detection Results
    ReactFrontend->>ReactFrontend: Highlight Detected PHI
    ReactFrontend->>ReactFrontend: Show Redaction Options
    
    Clinician->>ReactFrontend: Confirm Redaction
    ReactFrontend->>PHIDetectionService: Apply Redaction
    PHIDetectionService-->>ReactFrontend: Redacted Text
    
    ReactFrontend->>RAGService: Retrieve Clinical Knowledge
    RAGService->>Database: Search Knowledge Base
    Database-->>RAGService: Relevant Information
    RAGService-->>ReactFrontend: Clinical Context
    
    ReactFrontend->>OpenAIGateway: Send Processed Prompt
    OpenAIGateway-->>ReactFrontend: AI Response
    ReactFrontend->>AuditLogger: Log Transaction
    AuditLogger->>Database: Store Complete Record
    
    ReactFrontend-->>Clinician: Display Enhanced Response
```

### 4.3.3 System Sequence Diagram

```mermaid
sequenceDiagram
    participant ExternalActor
    participant ClinGuardSystem
    participant Database
    
    ExternalActor->>ClinGuardSystem: submitPrompt(promptText: string)
    ClinGuardSystem->>Database: validateAndStore(promptText)
    Database-->>ClinGuardSystem: promptID: int
    ClinGuardSystem-->>ExternalActor: processingStatus: string
    
    ExternalActor->>ClinGuardSystem: detectPHI(promptID: int)
    ClinGuardSystem->>ClinGuardSystem: analyzePHI()
    ClinGuardSystem-->>ExternalActor: phiResults: array
    
    ExternalActor->>ClinGuardSystem: redactContent(promptID: int, redactionRules: object)
    ClinGuardSystem->>ClinGuardSystem: applyRedaction()
    ClinGuardSystem-->>ExternalActor: redactedText: string
    
    ExternalActor->>ClinGuardSystem: generateResponse(processedPrompt: string)
    ClinGuardSystem->>ClinGuardSystem: callOpenAI()
    ClinGuardSystem-->>ExternalActor: aiResponse: string
    
    ExternalActor->>ClinGuardSystem: logActivity(activityData: object)
    ClinGuardSystem->>Database: storeAuditLog(activityData)
    Database-->>ClinGuardSystem: logID: int
    ClinGuardSystem-->>ExternalActor: confirmation: string
```

## 4.4 System Design Diagrams (OOAD Approach)

### 4.4.1 Entity-Relationship Diagram

```mermaid
erDiagram
    USERS {
        int UserID PK
        string FirstName
        string LastName
        string Email UK
        string PasswordHash
        int OrganizationID FK
        int RoleID FK
        timestamp CreatedAt
        timestamp UpdatedAt
    }
    
    ORGANIZATIONS {
        int OrganizationID PK
        string OrganizationName
        string ContactEmail
        string PhoneNumber
        text Address
        timestamp CreatedAt
    }
    
    ROLES {
        int RoleID PK
        string RoleName UK
        text Description
        json Permissions
        timestamp CreatedAt
    }
    
    POLICIES {
        int PolicyID PK
        int OrganizationID FK
        string PolicyName
        json DetectionThresholds
        json RedactionRules
        boolean IsActive
        timestamp CreatedAt
    }
    
    PROMPTS {
        int PromptID PK
        int UserID FK
        text OriginalText
        text ProcessedText
        int RedactionCount
        timestamp Timestamp
        enum Status
    }
    
    PHI_DETECTIONS {
        int DetectionID PK
        int PromptID FK
        string PHIType
        decimal ConfidenceScore
        int StartPosition
        int EndPosition
        string RedactionMethod
        timestamp Timestamp
    }
    
    AUDIT_LOGS {
        int LogID PK
        int UserID FK
        string Action
        string IPAddress
        text UserAgent
        timestamp Timestamp
        json Details
    }
    
    KNOWLEDGE_BASE {
        int KnowledgeID PK
        string Title
        text Content
        string Category
        json VectorEmbedding
        timestamp LastUpdated
    }
    
    USER_ROLES {
        int UserID PK,FK
        int RoleID PK,FK
        timestamp AssignedAt
    }
    
    USERS ||--o{ PROMPTS : submits
    USERS ||--o{ AUDIT_LOGS : generates
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    ORGANIZATIONS ||--o{ USERS : employs
    ORGANIZATIONS ||--o{ POLICIES : defines
    PROMPTS ||--o{ PHI_DETECTIONS : contains
```

### 4.4.2 Logical Database Schema

```mermaid
erDiagram
    USERS {
        INT UserID PK AUTO_INCREMENT
        VARCHAR(255) FirstName NOT NULL
        VARCHAR(255) LastName NOT NULL
        VARCHAR(255) Email UNIQUE NOT NULL
        VARCHAR(255) PasswordHash NOT NULL
        INT OrganizationID FK
        INT RoleID FK
        TIMESTAMP CreatedAt DEFAULT CURRENT_TIMESTAMP
        TIMESTAMP UpdatedAt DEFAULT CURRENT_TIMESTAMP ON UPDATE
        INDEX idx_email (Email)
        INDEX idx_organization (OrganizationID)
    }
    
    ORGANIZATIONS {
        INT OrganizationID PK AUTO_INCREMENT
        VARCHAR(255) OrganizationName NOT NULL
        VARCHAR(255) ContactEmail NOT NULL
        VARCHAR(50) PhoneNumber
        TEXT Address
        TIMESTAMP CreatedAt DEFAULT CURRENT_TIMESTAMP
        INDEX idx_name (OrganizationName)
    }
    
    ROLES {
        INT RoleID PK AUTO_INCREMENT
        VARCHAR(100) RoleName UNIQUE NOT NULL
        TEXT Description
        JSON Permissions
        TIMESTAMP CreatedAt DEFAULT CURRENT_TIMESTAMP
    }
    
    POLICIES {
        INT PolicyID PK AUTO_INCREMENT
        INT OrganizationID FK NOT NULL
        VARCHAR(255) PolicyName NOT NULL
        JSON DetectionThresholds
        JSON RedactionRules
        BOOLEAN IsActive DEFAULT TRUE
        TIMESTAMP CreatedAt DEFAULT CURRENT_TIMESTAMP
        INDEX idx_organization (OrganizationID)
        INDEX idx_active (IsActive)
    }
    
    PROMPTS {
        INT PromptID PK AUTO_INCREMENT
        INT UserID FK NOT NULL
        LONGTEXT OriginalText NOT NULL
        LONGTEXT ProcessedText
        INT RedactionCount DEFAULT 0
        TIMESTAMP Timestamp DEFAULT CURRENT_TIMESTAMP
        ENUM('submitted','processing','completed','error') Status DEFAULT 'submitted'
        INDEX idx_user (UserID)
        INDEX idx_timestamp (Timestamp)
        INDEX idx_status (Status)
    }
    
    PHI_DETECTIONS {
        INT DetectionID PK AUTO_INCREMENT
        INT PromptID FK NOT NULL
        VARCHAR(100) PHIType NOT NULL
        DECIMAL(5,4) ConfidenceScore
        INT StartPosition
        INT EndPosition
        VARCHAR(50) RedactionMethod
        TIMESTAMP Timestamp DEFAULT CURRENT_TIMESTAMP
        INDEX idx_prompt (PromptID)
        INDEX idx_type (PHIType)
    }
    
    AUDIT_LOGS {
        INT LogID PK AUTO_INCREMENT
        INT UserID FK
        VARCHAR(255) Action NOT NULL
        VARCHAR(45) IPAddress
        TEXT UserAgent
        TIMESTAMP Timestamp DEFAULT CURRENT_TIMESTAMP
        JSON Details
        INDEX idx_user (UserID)
        INDEX idx_timestamp (Timestamp)
        INDEX idx_action (Action)
    }
    
    KNOWLEDGE_BASE {
        INT KnowledgeID PK AUTO_INCREMENT
        VARCHAR(255) Title NOT NULL
        LONGTEXT Content NOT NULL
        VARCHAR(100) Category
        JSON VectorEmbedding
        TIMESTAMP LastUpdated DEFAULT CURRENT_TIMESTAMP ON UPDATE
        INDEX idx_title (Title)
        INDEX idx_category (Category)
        FULLTEXT idx_content (Content, Title)
    }
    
    USER_ROLES {
        INT UserID PK,FK
        INT RoleID PK,FK
        TIMESTAMP AssignedAt DEFAULT CURRENT_TIMESTAMP
        PRIMARY KEY (UserID, RoleID)
    }
    
    FOREIGN KEY (Users.OrganizationID) REFERENCES Organizations(OrganizationID)
    FOREIGN KEY (Users.RoleID) REFERENCES ROLES(RoleID)
    FOREIGN KEY (Policies.OrganizationID) REFERENCES Organizations(OrganizationID)
    FOREIGN KEY (Prompts.UserID) REFERENCES USERS(UserID)
    FOREIGN KEY (PHI_Detections.PromptID) REFERENCES PROMPTS(PromptID)
    FOREIGN KEY (Audit_Logs.UserID) REFERENCES USERS(UserID)
    FOREIGN KEY (User_Roles.UserID) REFERENCES USERS(UserID)
    FOREIGN KEY (User_Roles.RoleID) REFERENCES ROLES(RoleID)
```

### 4.4.3 Class Diagram

```mermaid
classDiagram
    class UserInterface {
        -User currentUser
        -boolean isAuthenticated
        +login(credentials: Credentials) : boolean
        +logout() : void
        +submitPrompt(text: string) : Promise~Response~
        +viewHistory() : Prompt[]
    }
    
    class PHIDetectionComponent {
        -PHIDetection[] detectionResults
        -boolean isProcessing
        +detectPHI(text: string) : PHIDetection[]
        +highlightPHI(detections: PHIDetection[]) : void
        +redactContent(text: string) : string
    }
    
    class PromptEditor {
        -string content
        -RewriteSuggestion[] suggestions
        +handleTextChange(event: Event) : void
        +applySuggestion(suggestion: RewriteSuggestion) : void
        +submitPrompt() : Promise~Response~
    }
    
    class UserController {
        -array validationRules
        +authenticate(credentials: Credentials) : AuthResult
        +register(userData: UserData) : User
        +updateProfile(userId: int, data: ProfileData) : User
        +logout() : void
    }
    
    class PHIDetectionService {
        -RegexAnalyzer regexAnalyzer
        -EntropyAnalyzer entropyAnalyzer
        -MLClassifier mlClassifier
        +detectPHI(text: string) : PHIDetection[]
        +classifyPHI(text: string) : ClassificationResult
        +aggregateResults(results: DetectionResult[]) : PHIDetection[]
    }
    
    class PolicyManager {
        -Policy[] activePolicies
        -RuleEngine ruleEngine
        +evaluatePolicy(text: string) : PolicyResult
        +updateRules(policyId: int, rules: Rule[]) : void
        +getThresholds(orgId: int) : DetectionThresholds
    }
    
    class OpenAIService {
        -string apiKey
        -OpenAIClient client
        +generateResponse(prompt: string) : AIResponse
        +processPrompt(text: string) : ProcessedResponse
        +handleError(error: Error) : ErrorResponse
    }
    
    class AuditService {
        -Logger logger
        -EncryptionService encryptionService
        +logActivity(userId: int, action: string, details: object) : void
        +generateReport(startDate: Date, endDate: Date) : Report
        +exportData(format: string) : ExportData
    }
    
    class PHIDetector {
        -Pattern[] patterns
        -MLModel model
        +analyze(text: string) : AnalysisResult
        +detectPatterns(text: string) : Pattern[]
        +classifyText(text: string) : ClassificationResult
    }
    
    class RegexAnalyzer {
        -RegexPattern[] patterns
        +matchPatterns(text: string) : Match[]
        +extractPHI(text: string) : PHIEntity[]
        +calculateConfidence(match: Match) : float
    }
    
    class EntropyAnalyzer {
        -float threshold
        -int windowSize
        +calculateEntropy(text: string) : float
        +detectHighEntropy(text: string) : HighEntropyString[]
        +flagSuspicious(text: string) : SuspiciousString[]
    }
    
    class MLClassifier {
        -TransformerModel model
        -Tokenizer tokenizer
        +predict(text: string) : PredictionResult
        +preprocessText(text: string) : ProcessedText
        +postprocessResults(results: RawResult[]) : ClassificationResult[]
    }
    
    class BaseController {
        #Logger logger
        #Validator validator
        +validateInput(data: object) : ValidationResult
        +handleError(error: Error) : ErrorResponse
        #logRequest(request: Request) : void
    }
    
    UserInterface --> PHIDetectionComponent : uses
    UserInterface --> PromptEditor : contains
    PHIDetectionComponent --> PHIDetectionService : calls
    UserController --> PHIDetectionService : uses
    PHIDetectionService --> PolicyManager : consults
    PHIDetectionService --> OpenAIService : integrates
    PHIDetectionService --> AuditService : logs
    PHIDetectionService *-- PHIDetector : creates
    PHIDetector *-- RegexAnalyzer : uses
    PHIDetector *-- EntropyAnalyzer : uses
    PHIDetector *-- MLClassifier : uses
    
    UserController <|-- BaseController : inherits
    PolicyManager <|-- BaseController : inherits
```

### 4.4.4 Component Diagram

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[User Interface Component]
        UI -.-> IUI[IUserInterface Interface]
    end
    
    subgraph "Business Logic Layer"
        AUTH[Authentication Component]
        PHI[PHI Detection Component]
        AI[AI Integration Component]
        POLICY[Policy Management Component]
        AUDIT[Audit Component]
        
        AUTH -.-> IAuthService[IAuthService Interface]
        PHI -.-> IPHIDetectionService[IPHIDetectionService Interface]
        AI -.-> IAIService[IAIService Interface]
        POLICY -.-> IPolicyService[IPolicyService Interface]
        AUDIT -.-> IAuditService[IAuditService Interface]
    end
    
    subgraph "Data Access Layer"
        DB[Database Component]
        DB -.-> IDatabaseService[IDatabaseService Interface]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API]
        RAG[RAG Service]
        CHROMA[Vector Database]
    end
    
    subgraph "Infrastructure"
        ENCRYPT[Encryption Component]
        LOG[Logging Component]
        CACHE[Cache Component]
    end
    
    UI --> AUTH
    UI --> PHI
    UI --> AI
    UI --> POLICY
    UI --> AUDIT
    
    AUTH --> DB
    PHI --> DB
    PHI --> POLICY
    AI --> OPENAI
    AI --> RAG
    POLICY --> DB
    AUDIT --> DB
    
    RAG --> CHROMA
    AUTH --> ENCRYPT
    AUDIT --> ENCRYPT
    PHI --> LOG
    AI --> LOG
    AUTH --> CACHE
    DB --> CACHE
```

### 4.4.5 Deployment Diagram

```mermaid
graph TB
    subgraph "Internet"
        USERS[End Users]
    end
    
    subgraph "DMZ Zone"
        LB[Load Balancer]
        FIREWALL[Firewall]
    end
    
    subgraph "Web Server Layer"
        WS1[Web Server 1]
        WS2[Web Server 2]
        WS3[Web Server 3]
    end
    
    subgraph "Application Server Layer"
        LS1[Laravel Server 1]
        LS2[Laravel Server 2]
        PS1[Python Server 1]
        PS2[Python Server 2]
        QS[Queue Server]
    end
    
    subgraph "Database Layer"
        DB_MASTER[(MySQL Master)]
        DB_SLAVE1[(MySQL Slave 1)]
        DB_SLAVE2[(MySQL Slave 2)]
        REDIS[(Redis Cache)]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API]
        CHROMA[ChromaDB]
        MONITOR[Monitoring Stack]
    end
    
    subgraph "Internal Network"
        VPN[VPN Gateway]
    end
    
    USERS --> LB
    LB --> FIREWALL
    FIREWALL --> WS1
    FIREWALL --> WS2
    FIREWALL --> WS3
    
    WS1 --> LS1
    WS2 --> LS2
    WS3 --> PS1
    WS3 --> PS2
    
    LS1 --> DB_MASTER
    LS2 --> DB_MASTER
    PS1 --> DB_MASTER
    PS2 --> DB_MASTER
    
    LS1 --> REDIS
    LS2 --> REDIS
    PS1 --> REDIS
    PS2 --> REDIS
    
    DB_MASTER --> DB_SLAVE1
    DB_MASTER --> DB_SLAVE2
    
    PS1 --> QS
    PS2 --> QS
    
    PS1 --> OPENAI
    PS1 --> CHROMA
    PS2 --> OPENAI
    PS2 --> CHROMA
    
    LS1 --> MONITOR
    LS2 --> MONITOR
    PS1 --> MONITOR
    PS2 --> MONITOR
    
    VPN --> FIREWALL
```

---

## UML Standards Compliance

All diagrams follow UML 2.5 specifications with proper notation, relationships, and professional presentation suitable for academic documentation.
