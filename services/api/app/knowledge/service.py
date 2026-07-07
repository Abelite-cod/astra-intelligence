"""
Knowledge service — orchestrates the full ingestion pipeline:
1. Extract text from file/URL
2. Chunk text
3. Embed chunks
4. Upsert to Qdrant
5. Store chunk records in Postgres
"""
from __future__ import annotations
import hashlib
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.knowledge.ingestors import ingest_file, ingest_url
from app.knowledge.chunker import chunk_text
from app.knowledge.embedder import embed_texts
from app.knowledge.indexer import upsert_chunks, delete_document_chunks


async def process_document(
    db: AsyncSession,
    document_id: str,
    brand_id: str,
    content: str,
    source_metadata: dict,
) -> int:
    """
    Core pipeline: chunk → embed → index → persist.
    Returns number of chunks created.
    """
    # 1. Chunk
    chunks = chunk_text(content, metadata=source_metadata)
    if not chunks:
        return 0

    # 2. Embed all chunks in one batched call
    texts = [c.content for c in chunks]
    embeddings = await embed_texts(texts)

    # 3. Build payload list
    chunk_dicts = [
        {
            "content": c.content,
            "chunk_index": c.chunk_index,
            "token_count": c.token_count,
            "metadata": c.metadata,
            "embedding": embeddings[i],
        }
        for i, c in enumerate(chunks)
    ]

    # 4. Upsert to Qdrant — get back point IDs
    point_ids = await upsert_chunks(brand_id, document_id, chunk_dicts)

    # 5. Persist chunks in Postgres
    for i, (chunk, point_id) in enumerate(zip(chunks, point_ids)):
        await db.execute(
            text("""
                INSERT INTO knowledge_chunks
                    (document_id, brand_id, content, chunk_index,
                     token_count, metadata, embedding_id)
                VALUES
                    (:doc_id, :brand_id, :content, :chunk_index,
                     :token_count, :metadata, :embedding_id)
            """),
            {
                "doc_id": document_id,
                "brand_id": brand_id,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "token_count": chunk.token_count,
                "metadata": str(chunk.metadata),
                "embedding_id": point_id,
            },
        )

    # 6. Update document status
    total_tokens = sum(c.token_count for c in chunks)
    await db.execute(
        text("""
            UPDATE knowledge_documents
            SET status = 'indexed',
                chunk_count = :chunk_count,
                token_count = :token_count,
                updated_at = NOW()
            WHERE id = :doc_id
        """),
        {
            "doc_id": document_id,
            "chunk_count": len(chunks),
            "token_count": total_tokens,
        },
    )
    await db.commit()
    return len(chunks)


async def ingest_uploaded_file(
    db: AsyncSession,
    document_id: str,
    brand_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str = "",
) -> int:
    """Full pipeline for uploaded file."""
    await db.execute(
        text("UPDATE knowledge_documents SET status = 'processing' WHERE id = :id"),
        {"id": document_id},
    )
    await db.commit()

    try:
        raw_text = await ingest_file(file_bytes, filename, content_type)
        content_hash = hashlib.sha256(file_bytes).hexdigest()

        await db.execute(
            text("UPDATE knowledge_documents SET content_hash = :hash WHERE id = :id"),
            {"hash": content_hash, "id": document_id},
        )

        return await process_document(
            db,
            document_id,
            brand_id,
            raw_text,
            {"source": filename, "type": "file"},
        )
    except Exception as e:
        await db.execute(
            text("""
                UPDATE knowledge_documents
                SET status = 'failed', error_message = :err, updated_at = NOW()
                WHERE id = :id
            """),
            {"err": str(e), "id": document_id},
        )
        await db.commit()
        raise


async def ingest_url_document(
    db: AsyncSession,
    document_id: str,
    brand_id: str,
    url: str,
) -> int:
    """Full pipeline for URL crawl."""
    await db.execute(
        text("UPDATE knowledge_documents SET status = 'processing' WHERE id = :id"),
        {"id": document_id},
    )
    await db.commit()

    try:
        raw_text = await ingest_url(url)
        return await process_document(
            db,
            document_id,
            brand_id,
            raw_text,
            {"source": url, "type": "url"},
        )
    except Exception as e:
        await db.execute(
            text("""
                UPDATE knowledge_documents
                SET status = 'failed', error_message = :err, updated_at = NOW()
                WHERE id = :id
            """),
            {"err": str(e), "id": document_id},
        )
        await db.commit()
        raise


async def delete_document(
    db: AsyncSession,
    document_id: str,
) -> None:
    """Delete document + all its chunks from Postgres and Qdrant."""
    await delete_document_chunks(document_id)
    await db.execute(
        text("DELETE FROM knowledge_chunks WHERE document_id = :id"),
        {"id": document_id},
    )
    await db.execute(
        text("DELETE FROM knowledge_documents WHERE id = :id"),
        {"id": document_id},
    )
    await db.commit()
