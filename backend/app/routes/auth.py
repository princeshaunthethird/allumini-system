"""
Authentication routes: register, login, forgot/reset password.
"""
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, Token, UserOut, ForgotPasswordRequest, ResetPasswordRequest
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new alumni user account."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        graduation_year=payload.graduation_year,
        course=payload.course,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login with email + password, returns JWT token."""
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a password reset token (valid 1 hour).
    In production, send via email. For now, returns token in response.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Return success to prevent email enumeration
        return {"message": "If this email exists, a reset link has been sent."}

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # TODO: In production, send email with reset link
    # For development, return the token directly
    return {
        "message": "Password reset token generated.",
        "reset_token": reset_token,  # Remove in production!
        "note": "In production, this token would be emailed."
    }


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using the token from /forgot-password."""
    user = db.query(User).filter(User.reset_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if user.reset_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()

    return {"message": "Password reset successfully"}
