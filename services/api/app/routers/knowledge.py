"""
Knowledge router — real implementation using the ingestion pipeline.
"""
from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.dependencies import get_current_user
from app.database import get_db
from app.knowledge.service import ingest_uploaded_file, ingest_url_document, delete_document
from app.knowledge.retriever import retrieve, format_context

router = APIRouter()


class URLIngestRequest(BaseModel):
    url: str
    name: str = ""


class SearchRequest(BaseModel):
    query: str
    top_k: int = 20
    top_n: int = 5


# ── List documents ──────────────────────────────────────────────────────────

@router.get("/{brand_id}/knowledge")
async def list_documents(
    brand_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT id, name, type, source_url, status, chunk_count,
                   token_count, error_message, created_at, updated_at
            FROM knowledge_documents
            WHERE brand_id = :brand_id
            ORDER BY created_at DESC
        """),
        {"brand_id": brand_id},
    )
    rows = result.mappings().all()
    return {"documents": [dict(r) for r in rows]}


# ── Upload file ──────────────────────────────────────────────────────────────

@router.post("/{brand_id}/knowledge/upload")
async def upload_document(
    brand_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc_id = str(uuid.uuid4())
    file_bytes = await file.read()

    # Create document record
    await db.execute(
        text("""
            INSERT INTO knowledge_documents
                (id, brand_id, name, type, status)
            VALUES (:id, :brand_id, :name, :type, 'pending')
        """),
        {
            "id": doc_id,
            "brand_id": brand_id,
            "name": file.filename,
            "type": _detect_type(file.filename or ""),
        },
    )
    await db.commit()

    # Run ingestion in background
    background_tasks.add_task(
        ingest_uploaded_file,
        db,
        doc_id,
        brand_id,
        file_bytes,
        file.filename or "",
        file.content_type or "",
    )

    return {"document_id": doc_id, "status": "processing", "filename": file.filename}


# ── Crawl URL ────────────────────────────────────────────────────────────────

@router.post("/{brand_id}/knowledge/url")
async def crawl_url(
    brand_id: str,
    body: URLIngestRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc_id = str(uuid.uuid4())
    name = body.name or body.url

    await db.execute(
        text("""
            INSERT INTO knowledge_documents
                (id, brand_id, name, type, source_url, status)
            VALUES (:id, :brand_id, :name, 'url', :url, 'pending')
        """),
        {"id": doc_id, "brand_id": brand_id, "name": name, "url": body.url},
    )
    await db.commit()

    background_tasks.add_task(
        ingest_url_document,
        db,
        doc_id,
        brand_id,
        body.url,
    )

    return {"document_id": doc_id, "status": "processing", "url": body.url}


# ── Get document status ──────────────────────────────────────────────────────

@router.get("/{brand_id}/knowledge/{doc_id}/status")
async def get_document_status(
    brand_id: str,
    doc_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT id, name, status, chunk_count, token_count, error_message
            FROM knowledge_documents
            WHERE id = :id AND brand_id = :brand_id
        """),
        {"id": doc_id, "brand_id": brand_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return dict(row)


# ── Delete document ──────────────────────────────────────────────────────────

@router.delete("/{brand_id}/knowledge/{doc_id}")
async def delete_document_endpoint(
    brand_id: str,
    doc_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_document(db, doc_id)
    return {"deleted": True, "document_id": doc_id}


# ── Semantic search ──────────────────────────────────────────────────────────

@router.post("/{brand_id}/knowledge/search")
async def search_knowledge(
    brand_id: str,
    body: SearchRequest,
    user: dict = Depends(get_current_user),
):
    chunks = await retrieve(
        brand_id=brand_id,
        query=body.query,
        top_k=body.top_k,
        top_n=body.top_n,
    )
    return {
        "query": body.query,
        "results": [
            {
                "content": c.content,
                "document_id": c.document_id,
                "score": c.score,
                "metadata": c.metadata,
            }
            for c in chunks
        ],
        "context": format_context(chunks),
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _detect_type(filename: str) -> str:
    fn = filename.lower()
    if fn.endswith(".pdf"):
        return "pdf"
    if fn.endswith(".docx"):
        return "docx"
    if fn.endswith(".txt") or fn.endswith(".md"):
        return "txt"
    return "file"
