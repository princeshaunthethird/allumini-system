"""
Connection (network) routes: send, accept, reject, list connections.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.database import get_db
from app.models import User, Connection, ConnectionStatus, Notification, NotificationType
from app.schemas import ConnectionRequest, ConnectionResponse, ConnectionAction, UserOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/connections", tags=["Connections"])


def _create_notification(db, user_id, ntype, message, ref_id=None):
    """Helper to create a notification record."""
    notif = Notification(user_id=user_id, type=ntype, message=message, reference_id=ref_id)
    db.add(notif)


@router.post("/request", response_model=ConnectionResponse, status_code=201)
def send_connection_request(
    payload: ConnectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a connection request to another user."""
    if payload.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")

    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing connection
    existing = db.query(Connection).filter(
        or_(
            (Connection.requester_id == current_user.id) & (Connection.receiver_id == payload.receiver_id),
            (Connection.requester_id == payload.receiver_id) & (Connection.receiver_id == current_user.id),
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Connection already exists with status: {existing.status.value}"
        )

    conn = Connection(requester_id=current_user.id, receiver_id=payload.receiver_id)
    db.add(conn)

    # Notify receiver
    _create_notification(
        db, payload.receiver_id,
        NotificationType.connection_request,
        f"{current_user.name} sent you a connection request",
        ref_id=current_user.id
    )

    db.commit()
    db.refresh(conn)
    return conn


@router.put("/{connection_id}/respond", response_model=ConnectionResponse)
def respond_to_connection(
    connection_id: int,
    payload: ConnectionAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept or reject a pending connection request."""
    conn = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.receiver_id == current_user.id,
        Connection.status == ConnectionStatus.pending
    ).first()

    if not conn:
        raise HTTPException(status_code=404, detail="Connection request not found")

    if payload.action == "accept":
        conn.status = ConnectionStatus.accepted
        _create_notification(
            db, conn.requester_id,
            NotificationType.connection_accepted,
            f"{current_user.name} accepted your connection request",
            ref_id=current_user.id
        )
    elif payload.action == "reject":
        conn.status = ConnectionStatus.rejected
    else:
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'reject'")

    db.commit()
    db.refresh(conn)
    return conn


@router.get("/pending", response_model=List[ConnectionResponse])
def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending incoming connection requests for the current user."""
    return db.query(Connection).filter(
        Connection.receiver_id == current_user.id,
        Connection.status == ConnectionStatus.pending
    ).all()


@router.get("/my-connections", response_model=List[UserOut])
def get_my_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all accepted connections for the current user."""
    conns = db.query(Connection).filter(
        or_(
            Connection.requester_id == current_user.id,
            Connection.receiver_id == current_user.id
        ),
        Connection.status == ConnectionStatus.accepted
    ).all()

    users = []
    for conn in conns:
        other_id = conn.receiver_id if conn.requester_id == current_user.id else conn.requester_id
        user = db.query(User).filter(User.id == other_id).first()
        if user:
            users.append(user)
    return users


@router.delete("/{connection_id}", status_code=204)
def remove_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove an accepted connection."""
    conn = db.query(Connection).filter(
        Connection.id == connection_id,
        or_(
            Connection.requester_id == current_user.id,
            Connection.receiver_id == current_user.id
        )
    ).first()

    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    db.delete(conn)
    db.commit()
