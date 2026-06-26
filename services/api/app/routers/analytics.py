from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/{brand_id}/analytics/overview")
async def analytics_overview(brand_id: str, user: dict = Depends(get_current_user)):
    return {"brand_id": brand_id, "overview": {}}


@router.get("/{brand_id}/analytics/posts")
async def analytics_posts(brand_id: str, user: dict = Depends(get_current_user)):
    return {"posts": []}


@router.get("/{brand_id}/analytics/campaigns")
async def analytics_campaigns(brand_id: str, user: dict = Depends(get_current_user)):
    return {"campaigns": []}


@router.get("/{brand_id}/analytics/competitors")
async def analytics_competitors(brand_id: str, user: dict = Depends(get_current_user)):
    return {"competitors": []}


@router.get("/{brand_id}/analytics/trends")
async def analytics_trends(brand_id: str, user: dict = Depends(get_current_user)):
    return {"trends": []}


@router.post("/{brand_id}/analytics/sync")
async def sync_analytics(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "sync_queued"}
