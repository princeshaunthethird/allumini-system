"""
Pydantic schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from app.models import ConnectionStatus, JobType, ApplicationStatus, NotificationType


# ─────────────────────────────────────────────
# Auth Schemas
# ─────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    graduation_year: Optional[int] = Field(None, ge=1950, le=2030)
    course: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


# ─────────────────────────────────────────────
# User Schemas
# ─────────────────────────────────────────────

class UserBase(BaseModel):
    name: str
    email: EmailStr
    graduation_year: Optional[int] = None
    course: Optional[str] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    graduation_year: Optional[int] = None
    course: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    profile_pic: Optional[str] = None
    resume: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    experience: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    experience: Optional[str] = None
    location: Optional[str] = None
    graduation_year: Optional[int] = None
    course: Optional[str] = None


class UserSearchResult(BaseModel):
    id: int
    name: str
    email: EmailStr
    course: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[str] = None
    profile_pic: Optional[str] = None
    college: Optional[str] = None
    connection_status: Optional[str] = None  # pending/accepted/none

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Connection Schemas
# ─────────────────────────────────────────────

class ConnectionRequest(BaseModel):
    receiver_id: int


class ConnectionResponse(BaseModel):
    id: int
    requester_id: int
    receiver_id: int
    status: ConnectionStatus
    created_at: datetime
    requester: Optional[UserOut] = None
    receiver: Optional[UserOut] = None

    class Config:
        from_attributes = True


class ConnectionAction(BaseModel):
    action: str  # "accept" or "reject"


# ─────────────────────────────────────────────
# Message Schemas
# ─────────────────────────────────────────────

class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(..., min_length=1, max_length=5000)


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender: Optional[UserOut] = None

    class Config:
        from_attributes = True


class ConversationSummary(BaseModel):
    user: UserOut
    last_message: str
    last_message_time: datetime
    unread_count: int


# ─────────────────────────────────────────────
# Job Schemas
# ─────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    company: str = Field(..., min_length=2, max_length=200)
    location: Optional[str] = None
    job_type: JobType = JobType.full_time
    description: str = Field(..., min_length=10)
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class JobOut(BaseModel):
    id: int
    poster_id: int
    title: str
    company: str
    location: Optional[str] = None
    job_type: JobType
    description: str
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    poster: Optional[UserOut] = None
    application_count: Optional[int] = 0
    has_applied: Optional[bool] = False

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Application Schemas
# ─────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    applicant_id: int
    cover_letter: Optional[str] = None
    status: ApplicationStatus
    created_at: datetime
    applicant: Optional[UserOut] = None
    job: Optional[JobOut] = None

    class Config:
        from_attributes = True


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


# ─────────────────────────────────────────────
# Notification Schemas
# ─────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    type: NotificationType
    message: str
    reference_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Dashboard Schema
# ─────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_connections: int
    pending_requests: int
    unread_messages: int
    active_jobs: int
    my_applications: int
    unread_notifications: int


# Update forward references
Token.model_rebuild()
