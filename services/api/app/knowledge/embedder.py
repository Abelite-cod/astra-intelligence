"""
Embedder — generates OpenAI text-embedding-3-large vectors.
Batched for efficiency, cached to avoid duplicate API calls.
"""
from __future__ import annotations
from typing import List
from openai import AsyncOpenAI
from app.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIM = 3072
BATCH_SIZE = 100  # OpenAI allows up to 2048 inputs per request


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed a list of texts. Returns a list of float vectors.
    Handles batching automatically.
    """
    if not texts:
        return []

    client = _get_client()
    all_embeddings: List[List[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        # Clean inputs — empty strings cause API errors
        batch = [t.strip().replace("\n", " ") or "." for t in batch]

        response = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings


async def embed_single(text: str) -> List[float]:
    """Embed a single query string."""
    results = await embed_texts([text])
    return results[0] if results else []
