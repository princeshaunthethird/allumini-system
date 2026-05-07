"""
SQLAlchemy ORM models for the Alumni Network System.
Defines all database tables with relationships and indexes.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey,
    Boolean, Enum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────

class ConnectionStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class JobType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    internship = "internship"
    contract = "contract"
    remote = "remote"


class ApplicationStatus(str, enum.Enum):
    applied = "applied"
    reviewed = "reviewed"
    shortlisted = "shortlisted"
    rejected = "rejected"


class NotificationType(str, enum.Enum):
    connection_request = "connection_request"
    connection_accepted = "connection_accepted"
    new_message = "new_message"
    job_application = "job_application"
    job_posted = "job_posted"


# ─────────────────────────────────────────────
# User & Profile
# ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    graduation_year = Column(Integer, nullable=True)
    course = Column(String(100), nullable=True)

    # Profile fields
    phone = Column(String(20), nullable=True)
    college = Column(String(200), nullable=True)
    skills = Column(Text, nullable=True)          # comma-separated or JSON
    bio = Column(Text, nullable=True)
    profile_pic = Column(String(500), nullable=True)
    resume = Column(String(500), nullable=True)
    linkedin = Column(String(300), nullable=True)
    github = Column(String(300), nullable=True)
    experience = Column(Text, nullable=True)
    location = Column(String(150), nullable=True)

    # Auth
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sent_connections = relationship(
        "Connection", foreign_keys="Connection.requester_id", back_populates="requester"
    )
    received_connections = relationship(
        "Connection", foreign_keys="Connection.receiver_id", back_populates="receiver"
    )
    sent_messages = relationship(
        "Message", foreign_keys="Message.sender_id", back_populates="sender"
    )
    received_messages = relationship(
        "Message", foreign_keys="Message.receiver_id", back_populates="receiver"
    )
    posted_jobs = relationship("Job", back_populates="poster")
    applications = relationship("Application", back_populates="applicant")
    notifications = relationship("Notification", back_populates="user")


# ─────────────────────────────────────────────
# Connections
# ─────────────────────────────────────────────

class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(ConnectionStatus), default=ConnectionStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Prevent duplicate connection requests
    __table_args__ = (
        UniqueConstraint("requester_id", "receiver_id", name="unique_connection"),
        Index("ix_connections_requester", "requester_id"),
        Index("ix_connections_receiver", "receiver_id"),
        Index("ix_connections_status", "status"),
    )

    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_connections")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_connections")


# ─────────────────────────────────────────────
# Messages
# ─────────────────────────────────────────────

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_messages_sender", "sender_id"),
        Index("ix_messages_receiver", "receiver_id"),
        Index("ix_messages_conversation", "sender_id", "receiver_id"),
    )

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


# ─────────────────────────────────────────────
# Jobs & Applications
# ─────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    poster_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(150), nullable=True)
    job_type = Column(Enum(JobType), default=JobType.full_time)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    salary_range = Column(String(100), nullable=True)
    deadline = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_jobs_poster", "poster_id"),
        Index("ix_jobs_active", "is_active"),
    )

    poster = relationship("User", back_populates="posted_jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    cover_letter = Column(Text, nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.applied)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("job_id", "applicant_id", name="unique_application"),
        Index("ix_applications_job", "job_id"),
        Index("ix_applications_applicant", "applicant_id"),
    )

    job = relationship("Job", back_populates="applications")
    applicant = relationship("User", back_populates="applications")


# ─────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    message = Column(Text, nullable=False)
    reference_id = Column(Integer, nullable=True)  # job_id, connection_id, etc.
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_notifications_user", "user_id"),
        Index("ix_notifications_read", "is_read"),
    )

    user = relationship("User", back_populates="notifications")
