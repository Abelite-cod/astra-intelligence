from fastapi import APIRouter, Depends
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/plans")
async def list_plans():
    return {
        "plans": [
            {"id": "starter", "name": "Starter", "price": 39, "tokens": 100000},
            {"id": "pro", "name": "Pro", "price": 149, "tokens": 500000},
            {"id": "business", "name": "Business", "price": 499, "tokens": 2000000},
        ]
    }


@router.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    return {"plan": "starter", "status": "trialing", "tokens_used": 0}


@router.post("/checkout")
async def create_checkout(user: dict = Depends(get_current_user)):
    return {"url": "stub — Stripe checkout session — implement with Stripe SDK"}


@router.post("/portal")
async def customer_portal(user: dict = Depends(get_current_user)):
    return {"url": "stub — Stripe customer portal"}


@router.get("/invoices")
async def list_invoices(user: dict = Depends(get_current_user)):
    return {"invoices": []}


@router.get("/usage")
async def get_usage(user: dict = Depends(get_current_user)):
    return {"tokens_used": 0, "tokens_limit": 100000, "reset_date": None}
