"""
Hybrid retriever — combines Qdrant vector search with Cohere reranking.
Falls back gracefully if Cohere key is not configured.
"""
from __future__ import annotations
from typing import List
from dataclasses import dataclass
from qdrant_client.models import Filter, FieldCondition, MatchValue, SearchRequest
from app.knowledge.indexer import get_qdrant, COLLECTION_NAME
from app.knowledge.embedder import embed_single
from app.config import settings


@dataclass
class RetrievedChunk:
    content: str
    document_id: str
    chunk_index: int
    score: float
    metadata: dict


async def vector_search(
    brand_id: str,
    query: str,
    top_k: int = 20,
) -> List[RetrievedChunk]:
    """Pure vector similarity search filtered by brand."""
    client = get_qdrant()
    query_vector = await embed_single(query)

    results = await client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="brand_id",
                    match=MatchValue(value=brand_id),
                )
            ]
        ),
        limit=top_k,
        with_payload=True,
    )

    return [
        RetrievedChunk(
            content=r.payload.get("content", ""),
            document_id=r.payload.get("document_id", ""),
            chunk_index=r.payload.get("chunk_index", 0),
            score=r.score,
            metadata={
                k: v
                for k, v in r.payload.items()
                if k not in ("content", "document_id", "chunk_index", "brand_id")
            },
        )
        for r in results
        if r.payload
    ]


async def rerank(
    query: str,
    chunks: List[RetrievedChunk],
    top_n: int = 5,
) -> List[RetrievedChunk]:
    """Rerank chunks with Cohere if API key is available."""
    if not settings.COHERE_API_KEY or not chunks:
        return chunks[:top_n]

    try:
        import cohere

        co = cohere.AsyncClient(settings.COHERE_API_KEY)
        documents = [c.content for c in chunks]

        response = await co.rerank(
            model="rerank-english-v3.0",
            query=query,
            documents=documents,
            top_n=top_n,
        )

        reranked = []
        for result in response.results:
            chunk = chunks[result.index]
            chunk.score = result.relevance_score
            reranked.append(chunk)
        return reranked

    except Exception:
        # Graceful fallback — return top_n without reranking
        return chunks[:top_n]


async def retrieve(
    brand_id: str,
    query: str,
    top_k: int = 20,
    top_n: int = 5,
) -> List[RetrievedChunk]:
    """
    Full retrieval pipeline:
    1. Vector search (top_k candidates)
    2. Cohere rerank (top_n final results)
    """
    candidates = await vector_search(brand_id, query, top_k=top_k)
    final = await rerank(query, candidates, top_n=top_n)
    return final


def format_context(chunks: List[RetrievedChunk]) -> str:
    """Format retrieved chunks into a context string for LLM prompts."""
    sections = []
    for i, chunk in enumerate(chunks, 1):
        sections.append(f"[Source {i}]\n{chunk.content}")
    return "\n\n---\n\n".join(sections)
