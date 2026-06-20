from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, verify_password, get_password_hash
from app.models.user import User
from app.schemas.schemas import UserOut

router = APIRouter()


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    experience_years: Optional[int] = None


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_profile(
    data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.full_name is not None:
        if len(data.full_name.strip()) < 2:
            raise HTTPException(
                status_code=400, detail="Name must be at least 2 characters"
            )
        current_user.full_name = data.full_name.strip()

    if data.target_role is not None:
        current_user.target_role = data.target_role.strip()

    if data.experience_years is not None:
        if data.experience_years < 0 or data.experience_years > 50:
            raise HTTPException(
                status_code=400, detail="Experience years must be between 0 and 50"
            )
        current_user.experience_years = data.experience_years

    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400, detail="New password must be at least 8 characters"
        )

    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400, detail="New password must be different from current"
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    await db.flush()

    return {"message": "Password changed successfully"}


@router.delete("/me")
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.delete(current_user)
    await db.flush()
    return {"message": "Account deleted successfully"}
