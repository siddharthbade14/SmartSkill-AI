import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from google import genai

from app.core.config import settings

logger = logging.getLogger("smartskill_ai.chat")

SYSTEM_INSTRUCTION = """You are the official SmartSkill AI Assistant for the Ministry of Statistics and Programme Implementation (MoSPI), Government of India, integrated with the iGOT Karmayogi civil services framework.

Your role is to assist statistical officers, field investigators, data analysts, and trainers with:
1. Official Statistical Methodologies: Consumer Price Index (CPI), Wholesale Price Index (WPI), Index of Industrial Production (IIP), National Accounts Statistics (NAS), Periodic Labour Force Survey (PLFS), Annual Survey of Industries (ASI), and Data Governance.
2. System Guidance for SmartSkill AI: Manual ingestion (PDF/DOCX), Human-in-the-Loop (HITL) quality curation, psychometric MCQ standards (item difficulty, discrimination, distractors), competency diagnostic meters, and iGOT course remediation.
3. National Statistical Systems Training Academy (NSSTA) curricula and capacity building.

Guidelines:
- Maintain an authoritative, respectful, highly factual, and clear civil-services tone.
- Give concise, structured answers with bullet points and bold headers when helpful.
- If asked about submitting inquiries or issues, remind them they can reach the team directly at smartskillai3@gmail.com.
"""


def get_gemini_client() -> Optional[genai.Client]:
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Google GenAI client: {e}")
        return None


def _call_gemini_generation_sync(
    client: genai.Client,
    prompt: str,
    system_instruction: str = SYSTEM_INSTRUCTION
) -> tuple[str, str]:
    """
    Synchronous worker that calls Gemini generate_content with fallback models.
    Returns (reply_text, model_name).
    """
    from google.genai import types

    models_to_try = [
        settings.GEMINI_MODEL or "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
    ]

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.3,
        max_output_tokens=1024,
    )

    last_err = None
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            if response.text and response.text.strip():
                return response.text.strip(), model_name
        except Exception as e:
            last_err = e
            logger.warning(f"Generation call with model '{model_name}' failed: {e}. Trying fallback if available.")
            continue

    if last_err:
        logger.error(f"All Gemini fallback models exhausted. Last error: {last_err}")
        raise last_err

    return (
        "I have processed your query regarding MoSPI statistical workflows. How else may I assist your training today?",
        "fallback"
    )



async def answer_chat_query(
    message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    user_name: Optional[str] = None,
    user_role: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Answers a user chat inquiry using Gemini 3.8 / 3.7 Flash via non-blocking worker thread.
    """
    client = get_gemini_client()
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    if not client:
        return {
            "reply": (
                "Hello! I am the SmartSkill AI Assistant for MoSPI and iGOT Karmayogi. "
                "I can assist you with statistical methodologies, question generation, and system workflows. "
                "To enable live generative responses, please ensure GEMINI_API_KEY is configured."
            ),
            "model": "offline-fallback",
            "timestamp": timestamp,
        }

    try:
        prompt_parts = []
        if conversation_history:
            for turn in conversation_history[-6:]:
                role = "User" if turn.get("sender") == "user" else "Assistant"
                prompt_parts.append(f"{role}: {turn.get('text', '')}")
        
        user_prefix = f"[{user_role or 'Statistical Officer'} {user_name or 'User'}]: " if user_name else "User: "
        prompt_parts.append(f"{user_prefix}{message}")
        full_input = "\n".join(prompt_parts)

        reply_text, used_model = await asyncio.to_thread(
            _call_gemini_generation_sync,
            client,
            full_input,
            SYSTEM_INSTRUCTION
        )

        return {
            "reply": reply_text,
            "model": used_model,
            "timestamp": timestamp,
        }
    except Exception as e:
        logger.error(f"Gemini chat generation failed: {e}", exc_info=True)
        return {
            "reply": (
                f"Thank you for reaching out to the MoSPI SmartSkill AI Assistant. "
                f"I encountered a temporary connection notice ({str(e)}). "
                f"You can also submit your question directly to our technical desk at smartskillai3@gmail.com."
            ),
            "model": "fallback-on-error",
            "timestamp": timestamp,
        }


async def generate_ai_triage_for_query(
    sender_name: str,
    sender_email: str,
    category: str,
    subject: str,
    message: str,
    role: str,
    department: str
) -> Dict[str, Any]:
    """
    Uses Gemini to analyze, categorize, and draft an immediate response
    and administrative triage for support queries to smartskillai3@gmail.com.
    """
    client = get_gemini_client()
    if not client:
        return {
            "ai_triage_solution": (
                "Your query has been recorded in the SmartSkill AI central repository. "
                "The NSSTA technical team will review your inquiry."
            ),
            "model": "offline"
        }

    triage_prompt = f"""You are the automated technical triage officer for SmartSkill AI (Ministry of Statistics & Programme Implementation - MoSPI).
A user has submitted the following inquiry to smartskillai3@gmail.com:

Sender: {sender_name} ({sender_email})
Role: {role}
Department: {department}
Category: {category}
Subject: {subject}
Message:
{message}

Please provide a structured, helpful triage response in 2-3 concise sections:
1. Immediate Advisory / Recommended Steps for the user based on official MoSPI guidelines.
2. Suggested Follow-up Action for the SmartSkill AI Support Desk (smartskillai3@gmail.com).
3. Estimated Priority: (Low / Medium / High / Urgent).
"""

    try:
        triage_text, used_model = await asyncio.to_thread(
            _call_gemini_generation_sync,
            client,
            triage_prompt,
            SYSTEM_INSTRUCTION
        )
        return {
            "ai_triage_solution": triage_text,
            "model": used_model
        }
    except Exception as e:
        logger.error(f"Gemini query triage failed: {e}")
        return {
            "ai_triage_solution": "Your query has been logged and forwarded to smartskillai3@gmail.com for review by our NSSTA technical team.",
            "model": "offline"
        }

