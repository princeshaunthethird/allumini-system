"""
Alumni Network System - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import settings
from app.database import engine, Base
from app.routes import (
    auth_router, users_router, connections_router,
    messages_router, jobs_router, notifications_router
)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# Ensure upload directories exist
Path("uploads/profiles").mkdir(parents=True, exist_ok=True)
Path("uploads/resumes").mkdir(parents=True, exist_ok=True)

# Seed demo data (safe to call multiple times — skips if already seeded)
from app.seed import seed_database
seed_database()

app = FastAPI(
    title=settings.APP_NAME,
    description="RESTful API for the Alumni Network Management System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─────────────────────────────────────────────
# CORS Middleware
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Static file serving for uploads
# ─────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─────────────────────────────────────────────
# Register all routers
# ─────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(connections_router)
app.include_router(messages_router)
app.include_router(jobs_router)
app.include_router(notifications_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs",
        "status": "running"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
