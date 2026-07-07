"""
Qdrant indexer — upserts embedding vectors with brand-scoped payloads.
Creates collections on first use.
"""
from __future__ import annotations
import uuid
from typing import List
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.config import settings
from app.knowledge.embedder import EMBEDDING_DIM

COLLECTION_NAME = "knowledge"

_client: AsyncQdrantClient | None = None


def get_qdrant() -> AsyncQdrantClient:
    global _client
    if _client is None:
        _client = AsyncQdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
        )
    return _client


async def ensure_collection() -> None:
    """Create collection if it doesn't exist."""
    client = get_qdrant()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]
    if COLLECTION_NAME not in names:
        await client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=EMBEDDING_DIM,
                distance=Distance.COSINE,
            ),
        )


async def upsert_chunks(
    brand_id: str,
    document_id: str,
    chunks: List[dict],  # [{content, chunk_index, token_count, metadata, embedding}]
) -> List[str]:
    """
    Upsert chunk embeddings into Qdrant.
    Returns list of point IDs inserted.
    """
    await ensure_collection()
    client = get_qdrant()

    points: List[PointStruct] = []
    point_ids: List[str] = []

    for chunk in chunks:
        point_id = str(uuid.uuid4())
        point_ids.append(point_id)
        points.append(
            PointStruct(
                id=point_id,
                vector=chunk["embedding"],
                payload={
                    "brand_id": brand_id,
                    "document_id": document_id,
                    "chunk_index": chunk["chunk_index"],
                    "content": chunk["content"],
                    "token_count": chunk["token_count"],
                    **chunk.get("metadata", {}),
                },
            )
        )

    await client.upsert(collection_name=COLLECTION_NAME, points=points)
    return point_ids


async def delete_document_chunks(document_id: str) -> None:
    """Delete all Qdrant points belonging to a document."""
    client = get_qdrant()
    await client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            ]
        ),
    )


async def delete_brand_chunks(brand_id: str) -> None:
    """Delete all Qdrant points for an entire brand."""
    client = get_qdrant()
    await client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="brand_id",
                    match=MatchValue(value=brand_id),
                )
            ]
        ),
    )
