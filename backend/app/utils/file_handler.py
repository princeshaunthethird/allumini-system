"""
File upload utilities for profile pictures and resumes.
"""
import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_RESUME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # Convert to bytes


def get_upload_path(subfolder: str) -> Path:
    """Return the absolute path to an upload subfolder, creating it if needed."""
    path = Path(settings.UPLOAD_DIR) / subfolder
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_profile_picture(file: UploadFile, user_id: int) -> str:
    """
    Save uploaded profile picture.
    Returns the relative URL path for storage in DB.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB"
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"profile_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    upload_path = get_upload_path("profiles") / filename

    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(content)

    return f"/uploads/profiles/{filename}"


async def save_resume(file: UploadFile, user_id: int) -> str:
    """
    Save uploaded resume (PDF/DOCX).
    Returns the relative URL path for storage in DB.
    """
    if file.content_type not in ALLOWED_RESUME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF and DOCX are allowed."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB"
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "pdf"
    filename = f"resume_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    upload_path = get_upload_path("resumes") / filename

    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(content)

    return f"/uploads/resumes/{filename}"


def delete_file(file_path: str) -> None:
    """Delete a file given its URL path (e.g., /uploads/profiles/pic.jpg)."""
    if not file_path:
        return
    # Strip leading slash and resolve relative to CWD
    relative = file_path.lstrip("/")
    full_path = Path(relative)
    if full_path.exists():
        full_path.unlink()
