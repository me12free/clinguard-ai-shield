# Chapter 4: System Analysis and Design

## 4.1 Introduction

This chapter presented the comprehensive system analysis and design for the ClinGuard web application, which focused on preventing Protected Health Information (PHI) leakage in AI service prompts using RAG and OpenAI integration. The chapter covered the detailed requirements gathering process, system analysis diagrams, and system design specifications that guided the development of the ClinGuard system. Object-Oriented Analysis and Design (OOAD) methodology was employed throughout the analysis and design phases, as it was best suited for modeling ClinGuard's architecture comprising distinct software objects that exhibit encapsulation, inheritance, and polymorphism. The analysis phase examined the existing healthcare AI documentation workflows and identified critical PHI protection requirements through use case analysis and sequence diagram modeling. The design phase translated these requirements into detailed technical specifications including class diagrams, database schemas, and system architecture using object-oriented principles.

## 4.2 System Requirements/Requirements Gathering

The system requirements were gathered through comprehensive analysis of healthcare documentation workflows, regulatory compliance requirements, and stakeholder interviews. The requirements collection process involved reviewing existing Data Loss Prevention systems, analyzing Kenya Data Protection Act 2019 compliance needs, and studying clinical AI usage patterns in healthcare settings.

### 4.2.1 Functional Requirements

The following functional requirements were identified and implemented in the ClinGuard system:

**(i) Authentication and Authorization Module**
This module was designed to manage user access control and role-based permissions within the ClinGuard system. The system collected user credentials including email addresses, passwords, names, and role assignments during registration. The authentication process implemented secure login mechanisms with password hashing, session management, and multi-factor authentication capabilities. User roles including Clinician, Administrator, and Security Officer were defined with specific permission levels for different system functionalities.

**(ii) PHI Detection and Redaction Module**
This core module was developed to identify and redact Protected Health Information from AI prompts in real-time. The system collected prompt text data from user inputs and processed it through a hybrid detection engine combining regex patterns, entropy analysis, and machine learning classifiers. The module supported detection of various PHI types including patient names, medical record numbers, phone numbers, email addresses, diagnoses, medications, and dates. Redaction functionality replaced detected PHI with standardized placeholders while preserving clinical context.

**(iii) OpenAI Integration Module**
This module was implemented to facilitate secure communication with OpenAI's API for AI-powered clinical documentation assistance. The system collected processed prompt data after PHI redaction and transmitted it to OpenAI's GPT-4 model. The module handled API key management, request formatting, response processing, and error handling. Integration included rate limiting, retry mechanisms, and fallback procedures for service interruptions.

**(iv) RAG Knowledge Retrieval Module**
The Retrieval-Augmented Generation module was designed to enhance AI responses with evidence-based clinical knowledge. The system collected clinical queries and retrieved relevant information from curated medical knowledge bases including treatment guidelines, drug databases (RxNorm), diagnostic codes (ICD-10), and procedure codes (CPT). The module utilized vector similarity search with ChromaDB to identify and rank relevant clinical information.

**(v) Policy Management Module**
This administrative module was developed to enable organizations to configure PHI detection policies and compliance settings. The system collected policy parameters including detection thresholds, redaction rules, bypass permissions, and audit requirements. The module supported multiple policy templates for different departments and user roles, with version control and change tracking capabilities.

**(vi) Audit and Compliance Module**
This module was implemented to maintain comprehensive audit trails for regulatory compliance and security monitoring. The system collected activity logs including user actions, PHI detection events, policy violations, and system access attempts. The module generated compliance reports for Kenya Data Protection Act 2019 requirements and provided searchable audit interfaces for administrators.

**(vii) User Interface Module**
The frontend module was developed to provide an intuitive web interface for clinicians and administrators. The system collected user interactions through form inputs, button clicks, and navigation events. The interface implemented real-time PHI highlighting, safe rewrite suggestions, and contextual clinical information display alongside AI responses.

### 4.2.2 Non-Functional Requirements

The following non-functional requirements were addressed in the ClinGuard system implementation:

**(i) System Security**
System security was achieved through multiple layers of protection including encrypted data transmission using HTTPS/TLS 1.3, secure password storage using bcrypt hashing, and implementation of Cross-Site Request Forgery (CSRF) protection. The system employed input validation and sanitization to prevent injection attacks, implemented rate limiting to prevent brute force attacks, and utilized secure session management with configurable timeout periods. Regular security updates and vulnerability scanning were integrated into the development lifecycle.

**(ii) Data Security**
Data security was implemented through comprehensive encryption measures both in transit and at rest. All sensitive data including PHI, user credentials, and audit logs were encrypted using AES-256 encryption standards. The system implemented database-level encryption, file system encryption, and secure key management practices. Data retention policies were enforced with automatic deletion of expired data, and secure backup procedures were established with encrypted storage and access controls.

**(iii) Performance Requirements**
Performance optimization was achieved through implementation of efficient PHI detection algorithms with sub-200 millisecond processing latency for prompts up to 300 tokens. The system utilized caching mechanisms for frequently accessed data, implemented database query optimization, and employed asynchronous processing for non-critical operations. Load balancing capabilities were integrated to handle concurrent user requests, and performance monitoring tools were implemented to track response times and system resource utilization.

**(iv) Scalability Requirements**
Scalability was addressed through modular architecture design supporting horizontal scaling of web servers and database servers. The system implemented containerized deployment using Docker, utilized database connection pooling, and employed stateless application design for easy scaling. Auto-scaling capabilities were configured for cloud deployment, and performance testing was conducted to validate system behavior under increased load conditions.

**(v) Usability Requirements**
Usability was achieved through intuitive user interface design following healthcare industry best practices. The system implemented responsive web design compatible with desktop and tablet devices, provided clear visual indicators for PHI detection results, and offered contextual help and guidance features. User experience testing was conducted with healthcare professionals to ensure workflow compatibility and minimize learning curves.

**(vi) Reliability Requirements**
System reliability was implemented through redundant server configurations, automated failover mechanisms, and comprehensive error handling procedures. The system achieved 99.9% uptime availability through load balancing, health monitoring, and rapid disaster recovery procedures. Regular system backups and recovery testing were conducted to ensure data integrity and service continuity.

**(vii) Compliance Requirements**
Regulatory compliance was achieved through implementation of Kenya Data Protection Act 2019 requirements and HIPAA standards. The system provided comprehensive audit logging, data subject rights management, and breach notification procedures. Privacy by design principles were incorporated throughout system development, and regular compliance audits were conducted to ensure adherence to regulatory requirements.

## 4.3 System Analysis Diagrams (OOAD Approach)

The system analysis phase employed Object-Oriented Analysis and Design (OOAD) methodology to model user interactions, system behaviors, and component relationships. The following OOAD diagrams were developed to capture the static and dynamic aspects of the ClinGuard system:

### 4.3.1 Use Case Diagram

The use case diagram was developed to illustrate the functional requirements and actor interactions within the ClinGuard system. The diagram identified primary actors including Clinician, Administrator, and Security Officer, along with their respective interactions with the system. Key use cases identified included:

**Primary Actors and Their Roles:**
- **Clinician Actor**: Hospital doctors, nurses, and clinical staff using AI for documentation
- **Administrator Actor**: IT staff managing system configuration and user accounts  
- **Security Officer Actor**: Compliance personnel monitoring PHI protection and audit trails

**Major Use Cases Identified:**
1. **Authenticate User** - Login/logout functionality with role-based access
2. **Submit AI Prompt** - Clinician enters clinical documentation prompts
3. **Detect PHI in Prompt** - Real-time analysis for Protected Health Information
4. **Redact PHI Content** - Automatic replacement of detected PHI with placeholders
5. **Generate AI Response** - OpenAI API integration for clinical assistance
6. **Retrieve Clinical Knowledge** - RAG system for evidence-based information
7. **Manage Detection Policies** - Administrative configuration of PHI rules
8. **Generate Compliance Reports** - Audit trail and regulatory reporting
9. **Emergency Bypass** - Override functionality for urgent clinical scenarios

The use case diagram established relationships between actors and use cases using include and extend relationships to show system dependencies and optional functionality. This analysis provided the foundation for understanding system boundaries and user interactions.

### 4.3.2 Sequence Diagram

The sequence diagram was created to model the dynamic behavior of the core ClinGuard use case: clinician prompt submission with PHI detection, RAG-enhanced knowledge retrieval, and OpenAI API integration. The diagram illustrated message exchanges between system objects over time.

**Participating Objects Identified:**
1. **Clinician**: Healthcare professional user
2. **React Frontend**: Web application UI component  
3. **Authentication Controller**: Laravel backend authentication
4. **PHI Detection Service**: Python-based detection engine
5. **Policy Manager**: Rule evaluation and enforcement
6. **RAG Service**: Clinical knowledge retrieval
7. **OpenAI Gateway**: External AI service integration
8. **Audit Logger**: Compliance and security logging
9. **Database**: Data persistence layer

**Key Sequences Modeled:**
1. **Authentication Flow**: User login → credential validation → session establishment
2. **Prompt Submission Flow**: Text input → validation → PHI detection pipeline
3. **PHI Detection Flow**: Regex analysis → entropy analysis → ML classification → result aggregation
4. **Redaction Flow**: PHI identification → placeholder replacement → safe rewrite suggestions
5. **AI Integration Flow**: Redacted prompt → OpenAI API call → response processing
6. **Knowledge Enhancement Flow**: Clinical query → vector search → knowledge retrieval → response augmentation
7. **Audit Flow**: Activity logging → compliance reporting → security monitoring

The sequence diagram highlighted the temporal relationships and synchronous/asynchronous communication patterns between system objects, providing detailed insight into system behavior and message passing.

### 4.3.3 System Sequence Diagram

The system sequence diagram was developed to show high-level system interactions for major use cases, focusing on system boundary events and external actor interactions without detailed internal object communications. The diagram provided a clear view of system responsibilities and input/output relationships.

**Major System Events Modeled:**
1. **Submit Prompt Event**: External input → system processing → output response
2. **Detect PHI Event**: Text analysis → classification results → confidence scores
3. **Redact Content Event**: PHI identification → replacement → sanitized output  
4. **Generate Response Event**: Processed prompt → AI service → enhanced response
5. **Log Activity Event**: System action → audit record → compliance data

The system sequence diagram established clear contracts between external actors and the system, defining input parameters, processing operations, and expected outputs for each major system event.

## 4.4 System Design Diagrams (OOAD Approach)

The system design phase employed Object-Oriented Design principles to translate the analysis models into detailed technical specifications. The following OOAD design diagrams were developed to guide the implementation of the ClinGuard system:

### 4.4.1 Entity-Relationship Diagram

The ER diagram was designed using Star UML to represent the logical data model for the ClinGuard system. The diagram identified core entities and their relationships, establishing the foundation for database implementation.

**Core Entities Identified:**
- **Users**: System users with authentication and authorization data
- **Roles**: User roles defining permissions and access levels
- **Organizations**: Healthcare institutions using the system
- **Policies**: PHI detection and redaction rules
- **Prompts**: User-submitted AI prompts with processing status
- **PHIDetections**: Detected PHI instances with classification details
- **AuditLogs**: System activity logs for compliance monitoring
- **KnowledgeBase**: Clinical knowledge for RAG functionality

**Key Relationships Defined:**
- **Users-Organizations**: Many-to-one relationship (multiple users per organization)
- **Users-Roles**: Many-to-many relationship (users can have multiple roles)
- **Organizations-Policies**: One-to-many relationship (organization has multiple policies)
- **Prompts-PHIDetections**: One-to-many relationship (prompt can have multiple PHI detections)
- **Users-AuditLogs**: One-to-many relationship (user generates multiple audit events)

The ER diagram established cardinality constraints, participation constraints, and data integrity rules for the database implementation.

### 4.4.2 Logical Database Schema

The logical database schema was designed to translate the ER diagram into implementable database structures using MySQL. The schema defined normalized table structures following Third Normal Form (3NF) to eliminate data redundancy and ensure data integrity.

**Primary Tables Defined:**

**Users Table**:
- UserID (PK, INT, AUTO_INCREMENT)
- FirstName (VARCHAR, NOT NULL)
- LastName (VARCHAR, NOT NULL)  
- Email (VARCHAR, UNIQUE, NOT NULL)
- PasswordHash (VARCHAR, NOT NULL)
- OrganizationID (FK, INT)
- RoleID (FK, INT)
- CreatedAt (TIMESTAMP)
- UpdatedAt (TIMESTAMP)

**Organizations Table**:
- OrganizationID (PK, INT, AUTO_INCREMENT)
- OrganizationName (VARCHAR, NOT NULL)
- ContactEmail (VARCHAR, NOT NULL)
- PhoneNumber (VARCHAR)
- Address (TEXT)
- CreatedAt (TIMESTAMP)

**Roles Table**:
- RoleID (PK, INT, AUTO_INCREMENT)
- RoleName (VARCHAR, UNIQUE, NOT NULL)
- Description (TEXT)
- Permissions (JSON)
- CreatedAt (TIMESTAMP)

**Policies Table**:
- PolicyID (PK, INT, AUTO_INCREMENT)
- OrganizationID (FK, INT)
- PolicyName (VARCHAR, NOT NULL)
- DetectionThresholds (JSON)
- RedactionRules (JSON)
- IsActive (BOOLEAN)
- CreatedAt (TIMESTAMP)

**Prompts Table**:
- PromptID (PK, INT, AUTO_INCREMENT)
- UserID (FK, INT)
- OriginalText (TEXT, NOT NULL)
- ProcessedText (TEXT)
- RedactionCount (INT)
- Timestamp (TIMESTAMP)
- Status (ENUM: 'submitted', 'processing', 'completed', 'error')

**PHIDetections Table**:
- DetectionID (PK, INT, AUTO_INCREMENT)
- PromptID (FK, INT)
- PHIType (VARCHAR, NOT NULL)
- ConfidenceScore (DECIMAL)
- StartPosition (INT)
- EndPosition (INT)
- RedactionMethod (VARCHAR)
- Timestamp (TIMESTAMP)

**AuditLogs Table**:
- LogID (PK, INT, AUTO_INCREMENT)
- UserID (FK, INT)
- Action (VARCHAR, NOT NULL)
- IPAddress (VARCHAR)
- UserAgent (TEXT)
- Timestamp (TIMESTAMP)
- Details (JSON)

**KnowledgeBase Table**:
- KnowledgeID (PK, INT, AUTO_INCREMENT)
- Title (VARCHAR, NOT NULL)
- Content (TEXT, NOT NULL)
- Category (VARCHAR)
- VectorEmbedding (JSON)
- LastUpdated (TIMESTAMP)

The schema included proper indexing strategies for frequently queried columns and foreign key constraints to maintain referential integrity.

### 4.4.3 Class Diagram

The class diagram was designed using Star UML to represent the static structure of the ClinGuard system's object-oriented components. The diagram illustrated classes, attributes, methods, and relationships following object-oriented design principles.

**Frontend Classes (React/TypeScript):**

**UserInterface Component**:
- Attributes: currentUser: User, isAuthenticated: boolean
- Methods: login(), logout(), submitPrompt(), viewHistory()

**PHIDetection Component**:
- Attributes: detectionResults: PHIDetection[], isProcessing: boolean
- Methods: detectPHI(text: string), highlightPHI(), redactContent()

**PromptEditor Component**:
- Attributes: content: string, suggestions: RewriteSuggestion[]
- Methods: handleTextChange(), applySuggestion(), submitPrompt()

**Backend Classes (Laravel/PHP):**

**UserController**:
- Attributes: validationRules: array
- Methods: authenticate(), register(), updateProfile(), logout()

**PHIDetectionService**:
- Attributes: regexAnalyzer, entropyAnalyzer, mlClassifier
- Methods: detectPHI(text: string), classifyPHI(), aggregateResults()

**PolicyManager**:
- Attributes: activePolicies: Policy[], ruleEngine
- Methods: evaluatePolicy(), updateRules(), getThresholds()

**OpenAIService**:
- Attributes: apiKey: string, client: OpenAIClient
- Methods: generateResponse(), processPrompt(), handleError()

**AuditService**:
- Attributes: logger: Logger, encryptionService
- Methods: logActivity(), generateReport(), exportData()

**Python Detection Engine Classes:**

**PHIDetector**:
- Attributes: patterns: Pattern[], model: MLModel
- Methods: analyze(text: string), detectPatterns(), classifyText()

**RegexAnalyzer**:
- Attributes: patterns: RegexPattern[]
- Methods: matchPatterns(), extractPHI(), calculateConfidence()

**EntropyAnalyzer**:
- Attributes: threshold: float, windowSize: int
- Methods: calculateEntropy(), detectHighEntropy(), flagSuspicious()

**MLClassifier**:
- Attributes: model: TransformerModel, tokenizer: Tokenizer
- Methods: predict(), preprocessText(), postprocessResults()

**Class Relationships Defined:**
- **Inheritance**: BaseController → UserController, PolicyController
- **Composition**: PHIDetectionService → RegexAnalyzer, EntropyAnalyzer, MLClassifier
- **Association**: UserController → PHIDetectionService (uses)
- **Aggregation**: PolicyManager → Policy (contains)

The class diagram implemented design patterns including Singleton for configuration management, Strategy for different PHI detection methods, and Observer for audit logging.

### 4.4.4 Component Diagram

The component diagram was created to show the high-level organization of system components and their dependencies. The diagram identified major components and their interfaces.

**Major Components Identified:**

**Authentication Component**:
- Interface: IAuthService
- Operations: login(), logout(), validateToken()
- Dependencies: Database Component, Encryption Component

**PHI Detection Component**:
- Interface: IPHIDetectionService  
- Operations: detectPHI(), redactContent(), analyzeResults()
- Dependencies: Policy Component, ML Component

**AI Integration Component**:
- Interface: IAIService
- Operations: generateResponse(), processPrompt(), validateResponse()
- Dependencies: OpenAI API, RAG Component

**Policy Management Component**:
- Interface: IPolicyService
- Operations: getPolicy(), updatePolicy(), validateRules()
- Dependencies: Database Component

**Audit Component**:
- Interface: IAuditService
- Operations: logEvent(), generateReport(), exportData()
- Dependencies: Database Component, Encryption Component

The component diagram facilitated understanding of system modularity and integration points, supporting maintainability and scalability objectives.

### 4.4.5 Deployment Diagram

The deployment diagram was designed to illustrate the physical architecture of the ClinGuard system in production environment. The diagram showed server nodes, network configurations, and communication protocols.

**Deployment Architecture:**

**Web Server Layer**:
- **Load Balancer**: Nginx for HTTP/HTTPS traffic distribution
- **Web Servers**: Multiple Apache/Nginx servers with PHP-FPM
- **SSL/TLS**: HTTPS encryption with certificate management

**Application Server Layer**:
- **Laravel Application Servers**: PHP application servers
- **Python Detection Servers**: Flask/FastAPI servers for PHI detection
- **Job Queue Servers**: Redis/Beanstalkd for background processing

**Database Layer**:
- **Primary Database**: MySQL 8.x master server
- **Replica Databases**: Multiple read replicas for scaling
- **Cache Layer**: Redis for session management and caching

**External Services**:
- **OpenAI API**: External AI service integration
- **Vector Database**: ChromaDB for RAG functionality
- **Monitoring**: Prometheus/Grafana for system monitoring

**Network Configuration**:
- **Internal Network**: Private network for component communication
- **DMZ**: Demilitarized zone for web-facing components
- **VPN**: Secure access for administrative functions

The deployment diagram addressed scalability requirements with load balancers, redundant configurations, and auto-scaling capabilities for cloud deployment.

## 4.5 Design Tools and Implementation Strategy

The OOAD design process utilized industry-standard tools to ensure comprehensive documentation and implementation guidance. Star UML was employed for class diagrams and database schema design, providing detailed object-oriented modeling capabilities. Visual Paradigm was utilized for use case diagrams and sequence diagrams, offering comprehensive UML modeling features.

The implementation strategy followed object-oriented principles with modular design, encapsulation, and clear separation of concerns. The design supported the Modified Waterfall development methodology by providing detailed specifications for each development phase. Component-based architecture facilitated parallel development and testing, while well-defined interfaces enabled integration between different technology stacks.

The comprehensive OOAD analysis and design provided the foundation for successful system implementation, ensuring that the ClinGuard system met all functional and non-functional requirements while maintaining scalability, security, and regulatory compliance objectives.
