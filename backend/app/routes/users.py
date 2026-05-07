"""
User profile routes: view, update, upload files, dashboard stats.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from app.database import get_db
from app.models import User, Connection, Message, Job, Application, ConnectionStatus, Notification
from app.schemas import UserOut, UserUpdate, UserSearchResult, DashboardStats
from app.utils.auth import get_current_user
from app.utils.file_handler import save_profile_picture, save_resume, delete_file

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return dashboard statistics for the current user."""
    uid = current_user.id

    total_connections = db.query(Connection).filter(
        or_(Connection.requester_id == uid, Connection.receiver_id == uid),
        Connection.status == ConnectionStatus.accepted
    ).count()

    pending_requests = db.query(Connection).filter(
        Connection.receiver_id == uid,
        Connection.status == ConnectionStatus.pending
    ).count()

    unread_messages = db.query(Message).filter(
        Message.receiver_id == uid,
        Message.is_read == False
    ).count()

    active_jobs = db.query(Job).filter(Job.is_active == True).count()

    my_applications = db.query(Application).filter(
        Application.applicant_id == uid
    ).count()

    unread_notifications = db.query(Notification).filter(
        Notification.user_id == uid,
        Notification.is_read == False
    ).count()

    return DashboardStats(
        total_connections=total_connections,
        pending_requests=pending_requests,
        unread_messages=unread_messages,
        active_jobs=active_jobs,
        my_applications=my_applications,
        unread_notifications=unread_notifications,
    )


@router.get("/search", response_model=List[UserSearchResult])
def search_users(
    q: Optional[str] = Query(None, description="Search by name, skills, or course"),
    course: Optional[str] = Query(None),
    graduation_year: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search alumni by name, skills, or course with optional filters."""
    query = db.query(User).filter(User.id != current_user.id, User.is_active == True)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                User.name.ilike(search),
                User.skills.ilike(search),
                User.course.ilike(search),
                User.college.ilike(search),
            )
        )
    if course:
        query = query.filter(User.course.ilike(f"%{course}%"))
    if graduation_year:
        query = query.filter(User.graduation_year == graduation_year)

    users = query.offset(skip).limit(limit).all()

    # Attach connection status for each result
    results = []
    for user in users:
        conn = db.query(Connection).filter(
            or_(
                (Connection.requester_id == current_user.id) & (Connection.receiver_id == user.id),
                (Connection.requester_id == user.id) & (Connection.receiver_id == current_user.id),
            )
        ).first()

        result = UserSearchResult(
            id=user.id,
            name=user.name,
            email=user.email,
            course=user.course,
            graduation_year=user.graduation_year,
            skills=user.skills,
            profile_pic=user.profile_pic,
            college=user.college,
            connection_status=conn.status.value if conn else "none",
        )
        results.append(result)

    return results


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific user's public profile."""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me", response_model=UserOut)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile fields."""
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/profile-picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload or replace the current user's profile picture."""
    # Delete old picture
    if current_user.profile_pic:
        delete_file(current_user.profile_pic)

    url = await save_profile_picture(file, current_user.id)
    current_user.profile_pic = url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/resume", response_model=UserOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload or replace the current user's resume (PDF/DOCX)."""
    if current_user.resume:
        delete_file(current_user.resume)

    url = await save_resume(file, current_user.id)
    current_user.resume = url
    db.commit()
    db.refresh(current_user)
    return current_user
