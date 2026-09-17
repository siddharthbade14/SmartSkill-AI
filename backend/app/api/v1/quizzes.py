from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin, get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.user import User
from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizResponse,
    QuizAdminDetailResponse,
    QuizLearnerDetailResponse
)
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/generate", response_model=QuizAdminDetailResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Generate deterministic, grounded MCQs from an ingested document using Gemini Pro (temp=0.0).
    Initializes a new Quiz in 'UNDER_REVIEW' status and populates the HITL review queue.
    """
    doc = db.query(Document).filter(Document.id == request.document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    if not doc.extracted_text or len(doc.extracted_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text is empty or too short to extract assessment items.",
        )

    # Deterministic generation
    try:
        generated_mcqs = ai_service.generate_mcqs(
            document_text=doc.extracted_text,
            num_questions=request.num_questions,
            target_competency=request.target_competency or "Statistical Methodology & Data Governance",
            difficulty=request.difficulty or "Intermediate"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Question generation failed: {str(e)}"
        )

    # Create Quiz entry
    quiz_title = request.title or f"Competency Assessment: {doc.title[:40]}"
    quiz = Quiz(
        title=quiz_title,
        description=request.description or f"AI-generated micro-learning module grounded in {doc.filename}.",
        document_id=doc.id,
        status="UNDER_REVIEW",
        target_competency=request.target_competency or "Statistical Methodology & Data Governance",
        time_limit_minutes=max(5, len(generated_mcqs) * 3),
        passing_percentage=70,
        created_by_id=admin_user.id
    )
    db.add(quiz)
    db.flush()  # obtain quiz.id

    # Add questions to database under PENDING_REVIEW
    created_questions = []
    for q in generated_mcqs:
        question_obj = Question(
            quiz_id=quiz.id,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_option=q.correct_option.strip().upper(),
            explanation=q.explanation,
            competency_tag=q.competency_tag,
            difficulty=q.difficulty,
            source_reference=q.source_reference,
            review_status="PENDING_REVIEW"
        )
        db.add(question_obj)
        created_questions.append(question_obj)

    db.commit()
    db.refresh(quiz)

    return quiz


@router.get("/", response_model=List[QuizResponse])
def list_quizzes(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List quizzes. Learners only see 'PUBLISHED' quizzes, while admins can view all.
    """
    query = db.query(Quiz)
    if current_user.role != "admin":
        query = query.filter(Quiz.status == "PUBLISHED")
    elif status_filter:
        query = query.filter(Quiz.status == status_filter)

    quizzes = query.order_by(Quiz.created_at.desc()).all()

    result = []
    for q in quizzes:
        total_q = len(q.questions)
        approved_q = sum(1 for item in q.questions if item.review_status == "APPROVED")
        pending_q = sum(1 for item in q.questions if item.review_status == "PENDING_REVIEW")
        
        resp = QuizResponse(
            id=q.id,
            title=q.title,
            description=q.description,
            document_id=q.document_id,
            status=q.status,
            target_competency=q.target_competency,
            time_limit_minutes=q.time_limit_minutes,
            passing_percentage=q.passing_percentage,
            created_by_id=q.created_by_id,
            created_at=q.created_at,
            updated_at=q.updated_at,
            total_questions=total_q,
            approved_questions=approved_q,
            pending_questions=pending_q
        )
        result.append(resp)

    return result


@router.get("/{quiz_id}")
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve quiz details. Admins get full HITL details; learners receive test questions without answers.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    if current_user.role == "admin":
        return QuizAdminDetailResponse.model_validate(quiz)
    
    # Learner view: only allow published quizzes and approved questions
    if quiz.status != "PUBLISHED":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This assessment is currently under review and not yet published.")
    
    approved_questions = [q for q in quiz.questions if q.review_status == "APPROVED"]
    quiz_dict = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "document_id": quiz.document_id,
        "status": quiz.status,
        "target_competency": quiz.target_competency,
        "time_limit_minutes": quiz.time_limit_minutes,
        "passing_percentage": quiz.passing_percentage,
        "questions": approved_questions
    }
    return QuizLearnerDetailResponse.model_validate(quiz_dict)


@router.post("/{quiz_id}/publish", response_model=QuizResponse)
def publish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Publish an approved quiz to the active learner assessment catalog.
    Requires at least one question with 'APPROVED' review status.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    approved_count = sum(1 for q in quiz.questions if q.review_status == "APPROVED")
    if approved_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish a quiz with 0 approved questions. Please review and approve questions in the HITL dashboard first.",
        )

    quiz.status = "PUBLISHED"
    db.commit()
    db.refresh(quiz)

    total_q = len(quiz.questions)
    pending_q = sum(1 for item in quiz.questions if item.review_status == "PENDING_REVIEW")

    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        document_id=quiz.document_id,
        status=quiz.status,
        target_competency=quiz.target_competency,
        time_limit_minutes=quiz.time_limit_minutes,
        passing_percentage=quiz.passing_percentage,
        created_by_id=quiz.created_by_id,
        created_at=quiz.created_at,
        updated_at=quiz.updated_at,
        total_questions=total_q,
        approved_questions=approved_count,
        pending_questions=pending_q
    )
