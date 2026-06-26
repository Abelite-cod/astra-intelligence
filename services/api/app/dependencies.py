from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.config import settings
from app.database import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validate Supabase JWT and return user payload."""
    token = credentials.credentials
    try:
        # Supabase JWTs are signed with SUPABASE_JWT_SECRET
        payload = jwt.decode(
            token,
            settings.SUPABASE_SERVICE_ROLE_KEY,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_roles(*roles: str):
    """Role-based access control dependency factory."""
    async def check_role(user: dict = Depends(get_current_user)):
        user_role = user.get("user_metadata", {}).get("role", "member")
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles: {roles}. Your role: {user_role}",
            )
        return user
    return check_role
