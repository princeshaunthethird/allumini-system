"""
Messaging routes: REST endpoints + WebSocket for real-time chat.
"""
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Dict
from app.database import get_db, SessionLocal
from app.models import User, Message, Notification, NotificationType
from app.schemas import MessageCreate, MessageOut, ConversationSummary
from app.utils.auth import get_current_user, decode_token

router = APIRouter(prefix="/api/messages", tags=["Messages"])


# ─────────────────────────────────────────────
# WebSocket Connection Manager
# ─────────────────────────────────────────────

class ConnectionManager:
    """Manages active WebSocket connections mapped by user_id."""

    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, data: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            await ws.send_json(data)


manager = ConnectionManager()


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time messaging.
    Connect via: ws://localhost:8000/api/messages/ws/<jwt_token>
    Send JSON: {"receiver_id": 5, "content": "Hello!"}
    """
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload.get("sub"))
    await manager.connect(user_id, websocket)

    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            content = data.get("content", "").strip()

            if not receiver_id or not content:
                continue

            # Persist message
            msg = Message(sender_id=user_id, receiver_id=receiver_id, content=content)
            db.add(msg)

            sender = db.query(User).filter(User.id == user_id).first()
            notif = Notification(
                user_id=receiver_id,
                type=NotificationType.new_message,
                message=f"New message from {sender.name if sender else 'Someone'}",
                reference_id=user_id
            )
            db.add(notif)
            db.commit()
            db.refresh(msg)

            msg_data = {
                "id": msg.id,
                "sender_id": user_id,
                "receiver_id": receiver_id,
                "content": content,
                "is_read": False,
                "created_at": msg.created_at.isoformat(),
                "sender_name": sender.name if sender else "",
                "sender_pic": sender.profile_pic if sender else None,
            }

            # Deliver to both sender and receiver if online
            await manager.send_to_user(user_id, msg_data)
            await manager.send_to_user(receiver_id, msg_data)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    finally:
        db.close()


# ─────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────

@router.post("/send", response_model=MessageOut)
def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message via REST (fallback when WebSocket not available)."""
    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found")

    msg = Message(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        content=payload.content
    )
    db.add(msg)

    notif = Notification(
        user_id=payload.receiver_id,
        type=NotificationType.new_message,
        message=f"New message from {current_user.name}",
        reference_id=current_user.id
    )
    db.add(notif)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/conversation/{other_user_id}", response_model=List[MessageOut])
def get_conversation(
    other_user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch paginated conversation history between current user and another user."""
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
        )
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    # Mark messages from the other user as read
    db.query(Message).filter(
        Message.sender_id == other_user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    return messages


@router.get("/conversations", response_model=List[ConversationSummary])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a list of all conversation partners with last message and unread count."""
    uid = current_user.id

    # Find all distinct users this user has chatted with
    sent_to = db.query(Message.receiver_id).filter(Message.sender_id == uid).distinct()
    received_from = db.query(Message.sender_id).filter(Message.receiver_id == uid).distinct()

    partner_ids = set(
        [r[0] for r in sent_to.all()] + [r[0] for r in received_from.all()]
    )

    conversations = []
    for partner_id in partner_ids:
        partner = db.query(User).filter(User.id == partner_id).first()
        if not partner:
            continue

        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == uid, Message.receiver_id == partner_id),
                and_(Message.sender_id == partner_id, Message.receiver_id == uid),
            )
        ).order_by(Message.created_at.desc()).first()

        unread = db.query(Message).filter(
            Message.sender_id == partner_id,
            Message.receiver_id == uid,
            Message.is_read == False
        ).count()

        if last_msg:
            from app.schemas import UserOut
            conversations.append(ConversationSummary(
                user=UserOut.model_validate(partner),
                last_message=last_msg.content[:100],
                last_message_time=last_msg.created_at,
                unread_count=unread,
            ))

    # Sort by most recent
    conversations.sort(key=lambda x: x.last_message_time, reverse=True)
    return conversations
