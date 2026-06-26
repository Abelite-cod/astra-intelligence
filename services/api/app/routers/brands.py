"""
Brands router — real implementation using brand_service.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.database import get_db
from app.services.brand_service import (
    create_brand,
    get_brand,
    list_brands,
    update_brand,
    get_knowledge_stats,
)

router = APIRouter()


class CreateBrandRequest(BaseModel):
    name: str
    website_url: Optional[str] = ""
    industry: Optional[str] = ""
    description: Optional[str] = ""
    tone_of_voice: Optional[str] = "professional"
    mission: Optional[str] = ""


class UpdateBrandRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    tone_of_voice: Optional[str] = None
    website_url: Optional[str] = None
    industry: Optional[str] = None
    keywords: Optional[list[str]] = None
    hashtags: Optional[list[str]] = None
    onboarded: Optional[bool] = None


@router.get("")
async def list_brands_endpoint(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.get("user_metadata", {}).get("org_id") or user.get("sub")
    brands = await list_brands(db, org_id)
    return {"brands": brands}


@router.post("")
async def create_brand_endpoint(
    body: CreateBrandRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.get("user_metadata", {}).get("org_id") or user.get("sub")
    brand = await create_brand(
        db,
        org_id=org_id,
        user_id=user["sub"],
        **body.model_dump(),
    )
    return brand


@router.get("/{brand_id}")
async def get_brand_endpoint(
    brand_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = await get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.patch("/{brand_id}")
async def update_brand_endpoint(
    brand_id: str,
    body: UpdateBrandRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    brand = await update_brand(db, brand_id, updates)
    return brand


@router.delete("/{brand_id}")
async def delete_brand_endpoint(
    brand_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import text
    await db.execute(text("DELETE FROM brands WHERE id = :id"), {"id": brand_id})
    await db.commit()
    return {"deleted": True}


@router.get("/{brand_id}/health-score")
async def brand_health_score(
    brand_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = await get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    stats = await get_knowledge_stats(db, brand_id)

    # Simple scoring heuristic
    score = 0
    reasons = []
    if brand.get("name"):
        score += 10
    if brand.get("description"):
        score += 15
    if brand.get("mission"):
        score += 10
    if brand.get("tone_of_voice"):
        score += 10
    if brand.get("target_audience"):
        score += 15
    if brand.get("website_url"):
        score += 10
    if brand.get("keywords"):
        score += 10
    docs = stats.get("indexed_count") or 0
    if docs >= 1:
        score += 10
        reasons.append(f"{docs} document(s) indexed")
    if docs >= 5:
        score += 10
        reasons.append("Rich knowledge base")

    return {"brand_id": brand_id, "score": min(score, 100), "reasons": reasons, "stats": stats}
