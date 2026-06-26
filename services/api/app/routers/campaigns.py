from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/{brand_id}/campaigns")
async def list_campaigns(brand_id: str, user: dict = Depends(get_current_user)):
    return {"campaigns": []}


@router.post("/{brand_id}/campaigns")
async def create_campaign(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.get("/{brand_id}/campaigns/{campaign_id}")
async def get_campaign(brand_id: str, campaign_id: str, user: dict = Depends(get_current_user)):
    return {"campaign_id": campaign_id}


@router.patch("/{brand_id}/campaigns/{campaign_id}")
async def update_campaign(brand_id: str, campaign_id: str, user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.delete("/{brand_id}/campaigns/{campaign_id}")
async def delete_campaign(brand_id: str, campaign_id: str, user: dict = Depends(get_current_user)):
    return {"deleted": True}


@router.post("/{brand_id}/campaigns/{campaign_id}/generate-strategy")
async def generate_strategy(brand_id: str, campaign_id: str, user: dict = Depends(get_current_user)):
    return {"status": "queued", "message": "AI strategy generation started — implement in Phase 2"}


@router.post("/{brand_id}/campaigns/{campaign_id}/generate-calendar")
async def generate_calendar(brand_id: str, campaign_id: str, user: dict = Depends(get_current_user)):
    return {"status": "queued", "message": "Calendar generation started — implement in Phase 2"}


@router.post("/{brand_id}/campaigns/{campaign_id}/launch")
async def launch_campaign(brand_id: str, campaign_id: str, user: dict = Depends(get_current_user)):
    return {"status": "active"}
