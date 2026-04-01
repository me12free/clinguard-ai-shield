# Clinical AI pipeline — what each part does

End-to-end flow for **Clinical AI chat** in ClinGuard:

```
User prompt
    → Laravel POST /api/chat
        → ① Detection engine POST /detect   (PHI spans)
        → ② Redact spans in text            (server-side, before any external LLM)
        → ③ Detection engine POST /rag        (optional retrieval)
        → ④ OpenAI chat completions         (uses redacted text + RAG context)
        → ⑤ Save conversation + audit row   (DB)
    → JSON back to the SPA
```

## ① PHI detection (`/detect`)

Runs in the **Python** service (`detection_engine/phi_detector.py`):

- **Regex / heuristics** — emails, phones, MRNs, dates, `Patient: Name,`, entropy, etc.
- **Optional NER** — your `phi_model/` token classifier and/or merged spans (`PHI_DETECTION_MODE`, `USE_ML`).

Laravel does **not** call OpenAI until after this step.

## ② Redaction

Laravel replaces each span in the **original** prompt with `[REDACTED-<CATEGORY>]` from **end to start** so offsets stay valid. That **redacted string** is what goes to OpenAI as the **user** message.

## ③ RAG — Retrieval-Augmented Generation (`/rag`)

**RAG** = *retrieve* relevant text chunks, then *augment* the LLM prompt with them.

1. Your **redacted** prompt (or a substring) is sent as the **query** (embedding).
2. **ChromaDB** stores small **clinical knowledge** snippets (seeded in `rag_engine.py`, or your own corpus).
3. The **top‑k** most similar chunks are returned.
4. Laravel passes them into the OpenAI **system** message as “Relevant clinical context”.

So RAG does **not** replace the model; it **grounds** the answer with short passages from your vector store. If RAG returns nothing, chat still works — the LLM just has no extra context.

## ④ OpenAI (the “AI” in the UI)

The **LLM** (e.g. `gpt-4o-mini`) generates the **assistant reply** from:

- System instructions + optional RAG text  
- **User message = redacted prompt** (identifiers removed per your rules)

OpenAI **never** receives the raw PHI from the spans list — only the redacted text (unless the model hallucinates; treat output as non‑guaranteed for compliance).

## ⑤ Persistence

Each successful chat can save **`conversations`** (`prompt_redacted`, `response_summary`). The **Chat history** tab loads these via `GET /api/conversations`.

---

## Why span count jumped (e.g. 5 → 28)

If you use **`PHI_DETECTION_MODE=both`** with a **local token model** (`phi_model`), the model may label **many subword pieces** as `PHI` (e.g. fragments of “diltiazem”, “CHA2DS2‑VASc”). That **over-segments** clinical text and over-redacts the prompt.

**Mitigations:**

- Use **`PHI_DETECTION_MODE=regex_only`** when you want **stable, rule-based** PHI for clinical paragraphs (identifiers + structured fields), or  
- Retune / retrain `phi_model` for your labels, or  
- Adjust merge/filter logic in `phi_detector.py` (project-specific).

See also **`docs/LOGGING_AND_ENGINE.md`** for `PHI_DETECTION_MODE` and `/health`.
