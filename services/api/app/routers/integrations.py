from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter()


@router.get("")
async def list_integrations(user: dict = Depends(get_current_user)):
    return {"integrations": []}


@router.post("/hubspot/connect")
async def connect_hubspot(user: dict = Depends(get_current_user)):
    return {"status": "stub — implement in Phase 4"}


@router.post("/salesforce/connect")
async def connect_salesforce(user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.post("/stripe/connect")
async def connect_stripe(user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.post("/shopify/connect")
async def connect_shopify(user: dict = Depends(get_current_user)):
    return {"status": "stub"}


@router.delete("/{integration_id}")
async def disconnect_integration(integration_id: str, user: dict = Depends(get_current_user)):
    return {"deleted": True}
