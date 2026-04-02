# Chapter 2: Literature Review

**Thesis formatting.** Apply the same faculty rules as Chapter 1 (Times New Roman 12 pt, 1.5 spacing, justified text, APA references). **Figures:** Class notes ask for **screenshots** of related systems where possible; insert **Figures 2.1 to 2.3** (or as directed by your supervisor) in the Word version after the related-work subsections.

## 2.1 Introduction

This chapter reviews published and professional literature relevant to **clinical generative AI**, **identification and protection of sensitive health data**, and **governance patterns** for third-party model APIs. It is organised as follows.

**Literature streams reviewed** (mapped to sections):

(i) **Regulatory and ethical context** for health data and third-party processing (Section 2.2).

(ii) **Challenges in current practice** when clinical teams adopt consumer-style or lightly governed AI tools (Section 2.2.1).

(iii) **Technical approaches** to sensitive data in text: rules, heuristics, named-entity recognition, and hybrid pipelines (Section 2.3).

(iv) **Related systems and product classes** illustrating the market and research landscape (Section 2.4), with space for comparative **screenshots** in the final thesis.

(v) **Synthesis of gaps** that motivated the ClinGuard design (Section 2.5).

(vi) **Conceptual framework** linking inputs, processing, and outputs (Section 2.6).

Full bibliographic entries appear in the **References** chapter in **APA** style. This Markdown source uses author-year placeholders in prose where you will attach final citations in Word.

## 2.2 Clinical generative AI and data protection context

Large language models gained traction in medicine for drafting text, summarisation, and question answering. Researchers and professional bodies warned that **free-text prompts could embed identifiers** and other sensitive attributes, and that **vendor retention**, **subprocessors**, and **cross-border** transfer complicated data protection impact assessments. The Kenya **Data Protection Act, 2019** emphasises lawful basis, purpose limitation, and security of processing, which applies when health-related personal data leaves an organisation’s controlled environment. **HIPAA-oriented** guidance in the United States similarly stresses **minimum necessary** disclosure and appropriate agreements where vendors process protected information. **International comparison:** high-income health systems have moved faster on vendor contracting for AI, while many low- and middle-income settings face similar risks with **fewer** institutional procurement layers; a lightweight technical gateway remains relevant in both contexts.

Literature in health informatics and AI ethics stressed **transparency**, **human oversight**, and **auditability** as complements to technical controls. Those themes informed ClinGuard’s emphasis on visible redaction outcomes, policy configuration, and security-oriented audit records.

### 2.2.1 Challenges in current practice

Common weaknesses reported in practice included: reliance on **user discipline** without tooling; **inconsistent** application of de-identification across teams; **lack of central policy** when multiple AI tools appeared in the same institution; and **limited forensic trails** after incidents. Consumer-grade chat products typically did not expose organisation-level policy objects or integrate with existing identity and access management for **clinical roles** (clinician, security officer, system administrator). *(Support with APA references.)*

## 2.3 Technical approaches to sensitive data in text

This section addresses **objective (i)** of Chapter 1 theoretically: how the literature describes protecting sensitive content in natural language.

**Rule-based and lexical methods** detected patterns such as national identifiers, phone numbers, and dates with high precision in well-formed text but struggled with context and novel phrasing. **Statistical and neural named-entity recognition** models assigned token- or span-level labels (for example BIO tagging) and could generalise beyond fixed patterns when trained on suitable corpora. **Hybrid pipelines** combined rules, heuristics (such as entropy filters), and models to balance latency and recall.

**Retrieval-augmented generation** augmented prompts with context from organisational knowledge bases; that pattern raised additional questions about **what text entered the retrieval index** and how retrieval results were filtered before being shown to the model. ClinGuard’s design treated retrieval as optional and subordinate to the same policy and logging discipline as the main chat path.

## 2.4 Related works

The following subsections discuss **at least three** distinct categories of related work (class expectation: minimum three, maximum four named areas). Insert **screenshots** in the final thesis as **Figure 2.1**, **Figure 2.2**, and **Figure 2.3** (or equivalent) showing each category’s representative interface or architecture, with captions in APA style for any reproduced images you have rights to use.

### 2.4.1 Consumer and enterprise large language model interfaces

General-purpose chat interfaces from major technology firms offered powerful models but **default configurations** were not tailored to clinical governance. **Enterprise** offerings began to add administrative controls, retention policies, and data residency options; cost and integration complexity often constrained adoption by smaller providers. **Shortcoming for this project:** a lightweight, inspectable stack combining **open components** with explicit PHI handling, organisation policy, and audit in one student-scoped system remained a distinct niche.

### 2.4.2 De-identification and clinical natural language processing toolkits

Research toolkits and commercial services addressed **de-identification** for research corpora (including tasks in the tradition of i2b2-style shared tasks) with strong results on benchmarks. **Shortcoming:** many tools targeted **batch** document processing rather than **interactive** chat with low-latency expectations, and did not bundle **role-based web UI**, **policy engines**, and **live LLM routing** in the same application studied here.

### 2.4.3 Healthcare integration and decision-support platforms

Major electronic health record vendors and middleware layers integrated AI features under strict contracting and long implementation cycles. **Shortcoming:** those paths assumed large-vendor roadmaps; ClinGuard explored a **parallel gateway** for settings where clinicians experimented with **external** models outside the core EHR workflow.

## 2.5 Gaps in related work

Synthesising Sections 2.2 through 2.4, gaps relevant to this project included: (i) **affordable, transparent** gateways for PHI-aware prompting tied to **organisational policy**; (ii) **unified** treatment of rules, heuristics, and learned detectors in a **single API** consumable by a modern single-page application; (iii) **audit and role separation** suitable for security review in a teaching-friendly codebase; (iv) **documented** training and evaluation of a detector aligned with **Kenya-relevant synthetic patterns** combined with **public PII-oriented** corpora. ClinGuard was positioned to address those gaps within the scope stated in Chapter 1.

## 2.6 Conceptual framework

The conceptual model for ClinGuard followed **input-process-output** structure required in class notes, with explicit governance feedback:

**Inputs:** authenticated clinical users; raw clinical or administrative text; organisational policies and allowlists; optional knowledge documents for retrieval.

**Processing:** identity and authorisation; PHI detection and redaction (and optional bypass under policy); optional retrieval; call to external model API; persistence of redacted prompts and audit metadata.

**Outputs:** model completions shown in the client; stored conversations; audit events for oversight; administrative views for policies, users, and organisations.

**Diagram requirement.** The final thesis should include a **conceptual framework diagram** (symbols for user devices, application server, detection service, database, external AI) with short labels on arrows matching the three stages above. Chapter 4 provides formal **UML** and **architecture** figures that instantiate this framework in systems analysis and design notation.
