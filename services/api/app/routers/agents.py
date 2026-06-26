from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/{brand_id}/agent-runs")
async def list_agent_runs(brand_id: str, user: dict = Depends(get_current_user)):
    return {"runs": []}


@router.get("/{brand_id}/agent-runs/{run_id}")
async def get_agent_run(brand_id: str, run_id: str, user: dict = Depends(get_current_user)):
    return {"run_id": run_id, "status": "stub"}


@router.post("/{brand_id}/agent-runs/{run_id}/cancel")
async def cancel_agent_run(brand_id: str, run_id: str, user: dict = Depends(get_current_user)):
    return {"cancelled": True}


@router.post("/{brand_id}/intelligence/morning-report")
async def generate_morning_report(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "queued", "message": "Morning intelligence report queued — implement in Phase 2"}


@router.post("/{brand_id}/intelligence/trend-scan")
async def run_trend_scan(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "queued"}


@router.post("/{brand_id}/intelligence/competitor-scan")
async def run_competitor_scan(brand_id: str, user: dict = Depends(get_current_user)):
    return {"status": "queued"}


@router.post("/{brand_id}/intelligence/chat")
async def chat_with_brand_ai(brand_id: str, user: dict = Depends(get_current_user)):
    return {"reply": "stub — implement in Phase 1", "sources": []}
