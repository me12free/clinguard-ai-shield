# Manual test prompts — Clinical AI & PHI detection

Use these to validate **PHI scan**, **Clinical AI chat** (redaction before OpenAI), **audit**, and **engine behavior**.  
Set `OPENAI_API_KEY` in `laravel-backend/.env` for real model replies; without it you should still see redaction and a placeholder AI message.

---

## Full clinician-style chat prompts (end-to-end)

Use these in **Clinical AI** to test the **whole path**: PHI detection → redaction → (optional RAG) → model reply. They read like real requests—not only identifier-heavy tests.

**Tip:** For a “clean” run (minimal redaction), use **A1–A5**. For **PHI + clinical** in one message, use **A6**.

### A1 — Inpatient: new hypoxia and tachycardia

```
I have a 68-year-old with COPD who was admitted for pneumonia two days ago. Overnight nursing called because SpO2 dropped to 88% on 2L NC. He is mildly tachycardic at 108, afebrile, new mild confusion. CXR from admission showed a right lower lobe infiltrate; he is on ceftriaxone and azithromycin. BMP today shows creatinine 1.4 up from baseline 1.0. Lactate 1.8. What should I prioritize in the next few hours for workup and management, and what are the main conditions I should not miss?
```

### A2 — Post-operative: fever and wound concern

```
Post-op day 2 after elective laparoscopic cholecystectomy. Patient is 52, female, previously healthy. Temp 38.4°C, HR 102, BP stable. Exam: mild tenderness around umbilical port sites, no erythema. WBC 12.5 with left shift. She is on scheduled acetaminophen and IV fluids. Outline a focused differential for post-op fever here, what additional history and exam I should document, and reasonable labs or imaging before I escalate. Keep it practical for a busy night shift.
```

### A3 — Ambulatory: uncontrolled Type 2 diabetes

```
Follow-up in clinic for Type 2 diabetes. HbA1c 8.9% three months ago; today patient reports increased thirst and fatigue. Home glucose logs are inconsistent but fasting values often 180–220. BMI 32, no hypoglycemia episodes. He is on metformin 1000 mg BID and sitagliptin. eGFR stable around 65. No foot ulcers. Help me outline a structured conversation about intensifying therapy: what options fit first-line add-on, what I should monitor, and what to document for shared decision-making.
```

### A4 — Emergency department: chest pain with benign ECG

```
45-year-old with 45 minutes of substernal pressure radiating to left arm, diaphoresis, arrived by EMS. Vitals: BP 148/88, HR 92, SpO2 98% RA. ECG shows normal sinus rhythm without ST changes. First troponin undetectable at 1 hour. History includes hypertension and hyperlipidemia; no prior CAD. He still feels a little pressure. How would you frame shared decision-making about observation vs further rule-out, and what red-flag symptoms should I explicitly document in the discharge instructions?
```

### A5 — Pediatrics: developmental and behavioral (screening)

```
Healthy 4-year-old at well-child visit. Parents worry he is not talking as much as peers; he understands commands and uses short phrases. No regression. No seizures. Hearing screening passed. They ask about autism spectrum and speech delay. I need a concise, evidence-aligned summary of what to screen for next, how to phrase referrals, and what safety-net advice to give parents without making a diagnosis in this chat.
```

### A6 — Realistic “pasted note” + PHI (full pipeline: clinical + identifiers)

**Goal:** Same as a clinician pasting from the EMR—**clinical content** plus **MRN, phone, email, dates** so you see redaction *and* a substantive AI reply.

**Expected spans (typical):** NAME (`Patient: … ,`), MRN, DATE, PHONE (`+1 (415) …`), EMAIL. After **restarting** the detection engine (`uvicorn`), you should see **5** PHI items redacted before OpenAI; if you only see **3**, the engine process is likely running **old code** (restart picks up `phi_detector.py` changes).

```
Please help me draft an assessment and plan paragraph for sign-out.

Patient: Maria Rodriguez, MRN 5567890, DOB 03/22/1975. Phone for daughter: +1 (415) 555-0199, email: daughter.contact@familymail.org.

56-year-old with new diagnosis of atrial fibrillation with RVR, rate controlled on diltiazem drip now transitioning to oral. CHA2DS2-VASc 4, HAS-BLED 2. She also has CKD stage 3 with baseline Cr 1.6. Echo pending for LV function. She is on apixaban per hospital protocol—confirm if I should adjust for renal function before discharge. What key points should I include in the handoff and what labs to recheck in the morning?
```

### A7 — Short “curbside” (quick model smoke test)

```
In a patient with cirrhosis and MELD-Na 22, what are the main indications to discuss transplant referral, and what should I document in the referral note?
```

---

## 1. Full clinical + PHI (baseline)

**Goal:** Multiple PHI types in one message; expect **redacted user message** to the model and **6+ spans** (depending on engine).

```
Help me diagnose this patient,
Patient: John Smith, MRN: 1234567
SSN: 123-45-6789
Contact: jane.doe@hospital.org, phone +1 (555) 123-4567
DOB: 10/15/1980 and also 2024-01-15
National ID No. 12345678
Text after PHI redaction
```

**Expected:** MRN, SSN, EMAIL, PHONE (if pattern matches), DATE(s), KENYA_NATIONAL_ID (or similar) as categories; prompt sent to OpenAI uses `[REDACTED-*]` tokens.

---

## 2. PHI scan only — minimal identifiers

**Goal:** Quick **Detect** tab check without long prose.

```
MRN 998877, call 555-0100, patient@clinic.test DOB 01/02/1999
```

---

## 3. No PHI — clinical content only

**Goal:** Ensure **no false-heavy redaction** on generic clinical text (may still flag rare patterns).

```
Summarize differential diagnosis for acute onset chest pain with normal ECG and negative troponins.
```

---

## 4. Names and locations (NER / regex overlap)

**Goal:** If `USE_ML=1` and NER is active, names may appear as NAME/PHI; regex may also catch structured IDs.

```
Refer Dr. Smith about Mary Johnson from Nairobi Clinic, room 4B.
```

---

## 5. Edge — international phone formats

**Goal:** Verify phone patterns used in your engine.

```
Reach family at +254 712 345678 or 0712345678
```

---

## 6. Edge — dates in clinical narrative

**Goal:** Multiple date formats.

```
Admitted 3/9/2024, surgery scheduled for 2024-09-15, follow-up 09-20-24.
```

---

## 7. Mixed English + numbers (entropy / noise)

**Goal:** Stress **entropy** branch if enabled.

```
Random: XK7Qm9pL2vR4nB8wZ1cF5hJ0sD6gT3yU
```

---

## 8. Allowlist / policy (if you add terms later)

**Goal:** Reserved for testing org-specific allowlisted tokens; adjust when `allowlists` are wired to detection.

```
[Use your org’s test allowlist strings here when available]
```

---

## 9. RAG / knowledge (optional)

**Goal:** Chat with OpenAI configured; response may cite **RAG context** from the Python `/rag` endpoint.

```
What are common red flags for sepsis in an adult inpatient?
```

---

## 10. Engine down / timeout

**Goal:** Stop `uvicorn` (or wrong `DETECTION_ENGINE_URL`); **PHI scan** and **chat** should show `engine_error`, empty or fallback spans — **no crash**.

---

## Verifying persistence

- After a successful **POST `/api/chat`**, rows should appear in **`conversations`** (`prompt_redacted`, `response_summary`).
- **GET `/api/conversations`** (authenticated, user with `chat`) returns your recent rows — use this to confirm the DB, even if the SPA has no history UI yet.

---

## Verifying ML vs regex-only

See **`docs/LOGGING_AND_ENGINE.md`** (or project README): `GET http://127.0.0.1:8001/health` on the detection engine, `USE_ML`, and `phi_model/` presence.
