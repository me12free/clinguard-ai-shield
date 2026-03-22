"""
RAG: ChromaDB + sentence-transformers. Seed with sample clinical snippets if collection empty.

If optional deps are missing or Chroma fails, ``rag_query`` returns ``[]`` so ``/rag`` and chat
never 500. Install: ``pip install chromadb sentence-transformers`` (see requirements.txt).

Edit DEFAULT_DOCS below for your test corpus. Bump CORPUS_VERSION so existing Chroma data
re-embeds on next engine start (or delete detection_engine/chroma_data manually).
"""
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger("clinguard.rag")

# Bump when you change DEFAULT_DOCS so the persisted collection is recreated and re-embedded.
CORPUS_VERSION = 2

# Curated snippets for demo RAG testing. Align quick prompts in src/lib/chatQuickPrompts.ts
# with topics here (hypertension, diabetes, anticoagulation/NSAIDs, documentation).
DEFAULT_DOCS = [
    (
        "Hypertension ambulatory care: First-line pharmacotherapy for uncomplicated hypertension "
        "often includes ACE inhibitors or ARBs when not contraindicated. Common BP target for most "
        "non-elderly adults is under 140/90 mmHg; consider lower targets for certain comorbidities "
        "per guideline. Titrate one agent at a time and reassess in 2-4 weeks when possible."
    ),
    (
        "Hypertension follow-up: For elevated BP on current therapy, verify adherence, home BP "
        "if available, and secondary causes when resistant. Adding a second agent from a different "
        "class (e.g. thiazide diuretic or CCB) is common when goal not met on moderate-dose ACE/ARB."
    ),
    (
        "Type 2 diabetes: Metformin is typical first-line for adults without contraindications. "
        "For ASCVD, heart failure, or CKD considerations, SGLT2 inhibitors or GLP-1 receptor "
        "agonists with proven cardiovascular or renal benefit may be preferred add-ons beyond "
        "glycemic effect alone."
    ),
    (
        "A1c and therapy intensification: Persistent A1c above individualized targets on metformin "
        "often prompts add-on therapy. Choice depends on comorbidities, hypoglycemia risk, cost, "
        "and patient preference; document shared decision-making."
    ),
    (
        "Anticoagulation and NSAIDs: Nonsteroidal anti-inflammatory drugs increase gastrointestinal "
        "and bleeding risk and can interact with anticoagulants including apixaban, rivaroxaban, "
        "warfarin, and dabigatran. Prefer acetaminophen for many musculoskeletal complaints when "
        "bleeding risk is a concern; if NSAIDs are unavoidable, use lowest dose, shortest duration, "
        "and gastroprotection when appropriate."
    ),
    (
        "Atrial fibrillation on DOAC: Direct oral anticoagulants require renal dose adjustment and "
        "avoidance of strong CYP3A4/P-gp inhibitors without review. Patient education should cover "
        "bleeding signs and holding doses around procedures per institutional protocol."
    ),
    (
        "CPT 99213: Office or other outpatient visit for the evaluation and management of an "
        "established patient, typically 20-29 minutes; low to moderate medical decision-making."
    ),
    (
        "CPT 99214: Established patient visit, 30-39 minutes; moderate to high complexity often "
        "involves multiple chronic conditions or prescription drug management."
    ),
    (
        "ICD-10 coding quick reference: I10 essential (primary) hypertension. E11.x type 2 diabetes "
        "mellitus without complications unless specified. Use additional codes for complications "
        "and chronic kidney disease stage when documented."
    ),
    (
        "Pain management with antithrombotic therapy: Document indication for anticoagulation, "
        "bleeding risk (falls, GI history), and nonpharmacologic measures. Topical NSAIDs may have "
        "lower systemic exposure than oral but still warrant caution; regional guidelines may vary."
    ),
]


_collection = None
_embed_fn = None
_rag_failure_logged = False


def _get_embed_fn():
    global _embed_fn
    if _embed_fn is None:
        from sentence_transformers import SentenceTransformer

        model = os.environ.get("RAG_EMBED_MODEL", "all-MiniLM-L6-v2")
        _embed_fn = SentenceTransformer(model)
    return _embed_fn


def _seed_collection(coll) -> None:
    embed = _get_embed_fn()
    ids = [f"doc_{i}" for i in range(len(DEFAULT_DOCS))]
    emb = embed.encode(DEFAULT_DOCS).tolist()
    coll.add(ids=ids, embeddings=emb, documents=DEFAULT_DOCS)


def _get_collection():
    global _collection
    import chromadb

    persist = Path(__file__).resolve().parent / "chroma_data"
    persist.mkdir(exist_ok=True)
    client = chromadb.PersistentClient(path=str(persist))

    need_fresh = False
    try:
        coll = client.get_collection("clinical")
        meta = coll.metadata or {}
        if meta.get("corpus_version") != str(CORPUS_VERSION):
            client.delete_collection("clinical")
            need_fresh = True
    except Exception:
        need_fresh = True

    if need_fresh:
        coll = client.get_or_create_collection(
            "clinical",
            metadata={
                "description": "Clinical knowledge (demo corpus)",
                "corpus_version": str(CORPUS_VERSION),
            },
        )
        _seed_collection(coll)
    else:
        coll = client.get_collection("clinical")

    if coll.count() == 0:
        _seed_collection(coll)

    _collection = coll
    return coll


def rag_query(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """Return top_k relevant chunks with content and optional score."""
    global _rag_failure_logged
    try:
        coll = _get_collection()
        embed = _get_embed_fn()
        n = coll.count()
        if n == 0:
            return []
        q_emb = embed.encode([query]).tolist()
        res = coll.query(
            query_embeddings=q_emb,
            n_results=min(top_k, n),
            include=["documents"],
        )
        docs = (res.get("documents") or [[]])[0]
        return [{"content": d, "text": d} for d in docs]
    except Exception as e:
        if not _rag_failure_logged:
            logger.warning(
                "RAG disabled: returning empty context. "
                "From detection_engine venv run: pip install -r requirements.txt "
                "(needs chromadb, sentence-transformers). Error: %s",
                e,
            )
            _rag_failure_logged = True
        return []
