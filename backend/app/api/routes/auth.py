from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
import secrets

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.services.email_service import (
    send_password_reset_email,
    send_welcome_email,
)
from pydantic import BaseModel, EmailStr

router = APIRouter()


# Extra Schemas (auth-specific)
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# In-memory token store (replace with DB/Redis in production)
reset_tokens: dict = {}


# Register
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: UserRegister,
    background_task: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        target_role=data.target_role,
        experience_years=data.experience_years,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


# Login
@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


# Forgot Password
@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if not user:
        return {
            "message": "If that email exists, a reset token has been generated.",
            "dev_note": "Email not found - no token generated",
        }

    # Generate secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    reset_tokens[token] = {
        "user_id": user.id,
        "email": user.email,
        "expires_at": expires_at,
    }

    # Send reset email in background
    background_tasks.add_task(
        send_password_reset_email,
        to_email=user.email,
        full_name=user.full_name,
        reset_token=token,
    )

    response = {
        "message": "Password reset email sent. Check your inbox.",
        "expires_in_minutes": 30,
    }

    # In development — also return token directly so you can test without email
    from app.core.config import settings

    if settings.ENVIRONMENT == "development":
        response["dev_token"] = token
        response["dev_note"] = (
            "Token included only in development mode. Remove in production."
        )

    return response


# Reset Password
@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters"
        )

    token_data = reset_tokens.get(data.token.strip())

    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.now(timezone.utc) > token_data["expires_at"]:
        del reset_tokens[data.token]
        raise HTTPException(
            status_code=400, detail="Reset token has expired. Request a new one."
        )

    # Update password
    result = await db.execute(select(User).where(User.id == token_data["user_id"]))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    await db.flush()

    # Invalidate token after use
    del reset_tokens[data.token]

    return {
        "message": "Password reset successfully. You can now login with your new password."
    }
