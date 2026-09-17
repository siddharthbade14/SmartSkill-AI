from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.support_service import dispatch_support_query
from app.services.chat_service import answer_chat_query, generate_ai_triage_for_query
from app.core.config import settings

router = APIRouter()


class SupportQueryRequest(BaseModel):
    name: str
    email: str
    role: Optional[str] = "Portal User"
    department: Optional[str] = "MoSPI"
    category: str
    subject: str
    message: str


class ChatMessageTurn(BaseModel):
    sender: str
    text: str


class ChatQueryRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessageTurn]] = None
    user_name: Optional[str] = None
    user_role: Optional[str] = None


@router.get("/status")
async def get_support_status() -> Dict[str, Any]:
    """
    Check current status of the support delivery service and AI engine.
    """
    return {
        "support_email": settings.SUPPORT_EMAIL,
        "smtp_configured": bool(settings.GMAIL_APP_PASSWORD),
        "ai_engine": settings.GEMINI_MODEL,
        "ai_configured": bool(settings.GEMINI_API_KEY),
        "status": "ready"
    }


@router.post("/query")
async def submit_support_query(payload: SupportQueryRequest) -> Dict[str, Any]:
    """
    Submits a user inquiry or technical support query to smartskillai3@gmail.com,
    and runs Gemini 3.8 Flash automated AI triage and solution drafting.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query message cannot be empty."
        )

    # 1. Run Gemini AI Smart Triage
    triage_info = await generate_ai_triage_for_query(
        sender_name=payload.name,
        sender_email=payload.email,
        category=payload.category,
        subject=payload.subject,
        message=payload.message,
        role=payload.role or "Portal User",
        department=payload.department or "MoSPI"
    )

    ai_solution = triage_info.get("ai_triage_solution", "")

    # 2. Dispatch clean query to smartskillai3@gmail.com
    result = await dispatch_support_query(
        sender_name=payload.name,
        sender_email=payload.email,
        category=payload.category,
        subject=payload.subject,
        message=payload.message.strip(),
        role=payload.role or "Portal User",
        department=payload.department or "MoSPI"
    )

    result["ai_solution"] = ai_solution
    result["ai_model"] = settings.GEMINI_MODEL
    return result


@router.post("/chat")
async def handle_ai_chat(payload: ChatQueryRequest) -> Dict[str, Any]:
    """
    Real-time interactive AI chatbot assistant powered by Gemini 3.8 Flash
    for MoSPI official statistics and iGOT micro-learning guidance.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    history_dicts = [turn.model_dump() for turn in payload.history] if payload.history else None

    response = await answer_chat_query(
        message=payload.message,
        conversation_history=history_dicts,
        user_name=payload.user_name,
        user_role=payload.user_role
    )
    return response
