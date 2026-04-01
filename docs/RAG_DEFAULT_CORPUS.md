# RAG demo corpus and quick prompts

## Where things live

- **Embeddings corpus:** `detection_engine/rag_engine.py`  
  - `DEFAULT_DOCS`: list of strings (paragraphs) stored in ChromaDB.  
  - `CORPUS_VERSION`: increment when you change `DEFAULT_DOCS` so the engine recreates the collection on startup (or delete `detection_engine/chroma_data` manually).

- **Clinical AI quick actions:** `src/lib/chatQuickPrompts.ts`  
  - `CLINICAL_AI_PHI_QUICK_PROMPTS`: three full prompts with synthetic PHI to test detection, redaction, and RAG together.

## How to test end-to-end

1. Edit `DEFAULT_DOCS` with the clinical facts you want retrievable.
2. Bump `CORPUS_VERSION` in `rag_engine.py` (or remove `detection_engine/chroma_data`).
3. Restart the Python engine (`uvicorn`).
4. Ensure Laravel `DETECTION_ENGINE_URL` points at that engine.
5. Use the three quick actions in the dashboard; after send, check **Retrieved context (RAG)** for chunks that match your topics.

## Prompt alignment (current)

| Quick action              | Topic                         | RAG docs to extend                          |
|---------------------------|-------------------------------|---------------------------------------------|
| BP follow-up (office)     | Hypertension, ACE/ARB, targets | First two hypertension paragraphs in `DEFAULT_DOCS` |
| Type 2 diabetes (A1c)   | Metformin, SGLT2, GLP-1, A1c  | Diabetes / A1c paragraphs                   |
| Anticoagulant + NSAID   | DOAC, bleeding, NSAID risk    | Anticoag + NSAID / pain paragraphs          |

Replace demo text with your institution’s approved references when moving beyond testing.
