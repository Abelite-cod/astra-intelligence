from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_current_user
from app.database import get_db

router = APIRouter()


@router.get("/{org_id}")
async def get_organization(
    org_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"org_id": org_id, "status": "stub — implement in Phase 1"}


@router.patch("/{org_id}")
async def update_organization(
    org_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return {"org_id": org_id, "status": "stub"}


@router.get("/{org_id}/members")
async def list_members(
    org_id: str,
    user: dict = Depends(get_current_user),
):
    return {"org_id": org_id, "members": []}


@router.get("/{org_id}/usage")
async def get_usage(
    org_id: str,
    user: dict = Depends(get_current_user),
):
    return {"org_id": org_id, "tokens_used": 0, "tokens_limit": 100000}
