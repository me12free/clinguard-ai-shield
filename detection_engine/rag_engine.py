"""
RAG: ChromaDB + sentence-transformers. Seed with sample clinical snippets if collection empty.
"""
import os
from pathlib import Path
from typing import Any

# Default clinical knowledge snippets (placeholder; replace with real guidelines)
DEFAULT_DOCS = [
    "Hypertension: First-line treatment includes ACE inhibitors or ARBs. Target BP <140/90 for most adults.",
    "Type 2 diabetes: Metformin first line. Consider SGLT2 or GLP-1 for CV benefit.",
    "Drug interaction: NSAIDs can increase bleeding risk with anticoagulants.",
    "ICD-10: I10 for essential hypertension. E11 for type 2 diabetes.",
    "CPT 99213: Office visit, established patient, low-moderate complexity.",
]

_collection = None
_embed_fn = None


def _get_embed_fn():
    global _embed_fn
    if _embed_fn is None:
        from sentence_transformers import SentenceTransformer
        model = os.environ.get("RAG_EMBED_MODEL", "all-MiniLM-L6-v2")
        _embed_fn = SentenceTransformer(model)
    return _embed_fn


def _get_collection():
    global _collection
    if _collection is None:
        import chromadb
        persist = Path(__file__).resolve().parent / "chroma_data"
        persist.mkdir(exist_ok=True)
        client = chromadb.PersistentClient(path=str(persist))
        _collection = client.get_or_create_collection("clinical", metadata={"description": "Clinical knowledge"})
        if _collection.count() == 0:
            _seed_collection()
    return _collection


def _seed_collection():
    coll = _collection
    embed = _get_embed_fn()
    ids = [f"doc_{i}" for i in range(len(DEFAULT_DOCS))]
    emb = embed.encode(DEFAULT_DOCS).tolist()
    coll.add(ids=ids, embeddings=emb, documents=DEFAULT_DOCS)


def rag_query(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """Return top_k relevant chunks with content and optional score."""
    coll = _get_collection()
    embed = _get_embed_fn()
    q_emb = embed.encode([query]).tolist()
    res = coll.query(query_embeddings=q_emb, n_results=min(top_k, coll.count()), include=["documents"])
    docs = (res.get("documents") or [[]])[0]
    return [{"content": d, "text": d} for d in docs]
