from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/{brand_id}/social-accounts")
async def list_social_accounts(brand_id: str, user: dict = Depends(get_current_user)):
    return {"accounts": []}


@router.delete("/{brand_id}/social-accounts/{account_id}")
async def disconnect_social_account(brand_id: str, account_id: str, user: dict = Depends(get_current_user)):
    return {"deleted": True}


@router.post("/{brand_id}/schedule")
async def schedule_post(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "scheduled"}


@router.get("/{brand_id}/scheduled")
async def list_scheduled(brand_id: str, user: dict = Depends(get_current_user)):
    return {"scheduled": []}


@router.delete("/{brand_id}/scheduled/{post_id}")
async def cancel_scheduled(brand_id: str, post_id: str, user: dict = Depends(get_current_user)):
    return {"cancelled": True}


@router.post("/{brand_id}/scheduled/{post_id}/publish-now")
async def publish_now(brand_id: str, post_id: str, user: dict = Depends(get_current_user)):
    return {"status": "publishing"}


@router.get("/{brand_id}/calendar")
async def get_calendar(brand_id: str, user: dict = Depends(get_current_user)):
    return {"events": []}
