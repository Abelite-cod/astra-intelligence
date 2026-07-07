"""
Brand service — CRUD operations for brands.
"""
from __future__ import annotations
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def create_brand(
    db: AsyncSession,
    org_id: str,
    user_id: str,
    name: str,
    **kwargs,
) -> dict:
    brand_id = str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO brands (id, org_id, name, website_url, industry, description,
                                tone_of_voice, mission, onboarded)
            VALUES (:id, :org_id, :name, :website_url, :industry, :description,
                    :tone_of_voice, :mission, false)
        """),
        {
            "id": brand_id,
            "org_id": org_id,
            "name": name,
            "website_url": kwargs.get("website_url", ""),
            "industry": kwargs.get("industry", ""),
            "description": kwargs.get("description", ""),
            "tone_of_voice": kwargs.get("tone_of_voice", "professional"),
            "mission": kwargs.get("mission", ""),
        },
    )
    await db.commit()
    return await get_brand(db, brand_id)


async def get_brand(db: AsyncSession, brand_id: str) -> Optional[dict]:
    result = await db.execute(
        text("SELECT * FROM brands WHERE id = :id"),
        {"id": brand_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def list_brands(db: AsyncSession, org_id: str) -> list[dict]:
    result = await db.execute(
        text("SELECT * FROM brands WHERE org_id = :org_id ORDER BY created_at DESC"),
        {"org_id": org_id},
    )
    return [dict(r) for r in result.mappings().all()]


async def update_brand(db: AsyncSession, brand_id: str, updates: dict) -> Optional[dict]:
    allowed = {
        "name", "description", "mission", "vision", "values",
        "tone_of_voice", "target_audience", "products", "competitors",
        "brand_colors", "fonts", "logo_url", "website_url",
        "industry", "keywords", "hashtags", "onboarded",
    }
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if not filtered:
        return await get_brand(db, brand_id)

    set_clauses = ", ".join(f"{k} = :{k}" for k in filtered)
    filtered["id"] = brand_id
    filtered["updated_at"] = "NOW()"

    await db.execute(
        text(f"UPDATE brands SET {set_clauses}, updated_at = NOW() WHERE id = :id"),
        filtered,
    )
    await db.commit()
    return await get_brand(db, brand_id)


async def get_knowledge_stats(db: AsyncSession, brand_id: str) -> dict:
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as document_count,
                SUM(chunk_count) as total_chunks,
                SUM(token_count) as total_tokens,
                COUNT(*) FILTER (WHERE status = 'indexed') as indexed_count,
                COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
                COUNT(*) FILTER (WHERE status = 'failed') as failed_count
            FROM knowledge_documents
            WHERE brand_id = :brand_id
        """),
        {"brand_id": brand_id},
    )
    row = result.mappings().first()
    return dict(row) if row else {}
