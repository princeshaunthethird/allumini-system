"""
Job portal routes: post, browse, apply, manage applications.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models import User, Job, Application, ApplicationStatus, Notification, NotificationType
from app.schemas import JobCreate, JobUpdate, JobOut, ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("/", response_model=JobOut, status_code=201)
def create_job(
    payload: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Post a new job opportunity."""
    job = Job(**payload.model_dump(), poster_id=current_user.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return _enrich_job(job, current_user.id, db)


@router.get("/", response_model=List[JobOut])
def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None, description="Search by title, company, or description"),
    job_type: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List jobs with optional search and filters. Paginated."""
    query = db.query(Job)

    if active_only:
        query = query.filter(Job.is_active == True)
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Job.title.ilike(search),
                Job.company.ilike(search),
                Job.description.ilike(search),
                Job.location.ilike(search),
            )
        )
    if job_type:
        query = query.filter(Job.job_type == job_type)

    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return [_enrich_job(j, current_user.id, db) for j in jobs]


@router.get("/my-jobs", response_model=List[JobOut])
def get_my_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all jobs posted by the current user."""
    jobs = db.query(Job).filter(Job.poster_id == current_user.id).order_by(Job.created_at.desc()).all()
    return [_enrich_job(j, current_user.id, db) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single job by ID."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _enrich_job(job, current_user.id, db)


@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    payload: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a job posting (only by the original poster)."""
    job = db.query(Job).filter(Job.id == job_id, Job.poster_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not authorized")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return _enrich_job(job, current_user.id, db)


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a job posting (only by the original poster)."""
    job = db.query(Job).filter(Job.id == job_id, Job.poster_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not authorized")
    db.delete(job)
    db.commit()


# ─────────────────────────────────────────────
# Applications
# ─────────────────────────────────────────────

@router.post("/{job_id}/apply", response_model=ApplicationOut, status_code=201)
def apply_for_job(
    job_id: int,
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply for a job."""
    job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or no longer active")

    if job.poster_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot apply to your own job posting")

    existing = db.query(Application).filter(
        Application.job_id == job_id,
        Application.applicant_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    app = Application(
        job_id=job_id,
        applicant_id=current_user.id,
        cover_letter=payload.cover_letter
    )
    db.add(app)

    # Notify job poster
    notif = Notification(
        user_id=job.poster_id,
        type=NotificationType.job_application,
        message=f"{current_user.name} applied for your job: {job.title}",
        reference_id=job_id
    )
    db.add(notif)
    db.commit()
    db.refresh(app)
    return app


@router.get("/{job_id}/applicants", response_model=List[ApplicationOut])
def get_applicants(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View all applicants for a job (only job poster can view)."""
    job = db.query(Job).filter(Job.id == job_id, Job.poster_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not authorized")

    return db.query(Application).filter(Application.job_id == job_id).all()


@router.put("/applications/{app_id}/status", response_model=ApplicationOut)
def update_application_status(
    app_id: int,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an application status (job poster only)."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.job.poster_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    app.status = payload.status
    db.commit()
    db.refresh(app)
    return app


@router.get("/my-applications/list", response_model=List[ApplicationOut])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all job applications submitted by the current user."""
    return db.query(Application).filter(
        Application.applicant_id == current_user.id
    ).order_by(Application.created_at.desc()).all()


# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────

def _enrich_job(job: Job, user_id: int, db: Session) -> JobOut:
    """Add application count and has_applied flag to a job."""
    app_count = db.query(Application).filter(Application.job_id == job.id).count()
    has_applied = db.query(Application).filter(
        Application.job_id == job.id,
        Application.applicant_id == user_id
    ).first() is not None

    from app.schemas import JobOut as JO, UserOut
    result = JO.model_validate(job)
    result.application_count = app_count
    result.has_applied = has_applied
    return result
