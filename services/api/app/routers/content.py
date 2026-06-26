from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/{brand_id}/content")
async def list_content(brand_id: str, user: dict = Depends(get_current_user)):
    return {"content": []}


@router.post("/{brand_id}/content/generate")
async def generate_content(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "queued", "message": "Content generation started — implement in Phase 2"}


@router.post("/{brand_id}/content/repurpose")
async def repurpose_content(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "queued", "message": "Repurposing started — implement in Phase 2"}


@router.get("/{brand_id}/content/{content_id}")
async def get_content(brand_id: str, content_id: str, user: dict = Depends(get_current_user)):
    return {"content_id": content_id}


@router.patch("/{brand_id}/content/{content_id}")
async def update_content(brand_id: str, content_id: str, user: dict = Depends(get_current_user)):
    return {"status": "updated"}


@router.delete("/{brand_id}/content/{content_id}")
async def delete_content(brand_id: str, content_id: str, user: dict = Depends(get_current_user)):
    return {"deleted": True}


@router.post("/{brand_id}/content/{content_id}/approve")
async def approve_content(brand_id: str, content_id: str, user: dict = Depends(get_current_user)):
    return {"status": "approved"}


@router.post("/{brand_id}/content/{content_id}/reject")
async def reject_content(brand_id: str, content_id: str, user: dict = Depends(get_current_user)):
    return {"status": "rejected"}


@router.post("/{brand_id}/content/{content_id}/feedback")
async def submit_feedback(brand_id: str, content_id: str, user: dict = Depends(get_current_user)):
    return {"status": "feedback_recorded"}
