from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin
from app.db.session import get_db
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.question import (
    QuestionAdminResponse,
    QuestionReviewUpdate,
    BulkReviewRequest
)

router = APIRouter()


@router.get("/questions/pending", response_model=List[QuestionAdminResponse])
def get_pending_questions(
    quiz_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Retrieve questions awaiting human trainer review and verification.
    """
    query = db.query(Question).filter(Question.review_status == "PENDING_REVIEW")
    if quiz_id:
        query = query.filter(Question.quiz_id == quiz_id)
    
    questions = query.order_by(Question.created_at.desc()).all()
    return questions


@router.put("/questions/{question_id}/review", response_model=QuestionAdminResponse)
def review_question(
    question_id: int,
    review_data: QuestionReviewUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Human-in-the-Loop review action: Approve, Reject, or Modify an AI-generated question.
    Trainers can correct hallucinated terms, refine distractors, or adjust competency tags.
    """
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    status_upper = review_data.review_status.upper()
    if status_upper not in ["APPROVED", "REJECTED", "MODIFIED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review status. Must be APPROVED, REJECTED, or MODIFIED."
        )

    question.review_status = status_upper
    question.reviewed_by_id = admin_user.id
    if review_data.reviewer_notes:
        question.reviewer_notes = review_data.reviewer_notes

    # If modifications to question content were supplied
    if review_data.question_text is not None:
        question.question_text = review_data.question_text
    if review_data.option_a is not None:
        question.option_a = review_data.option_a
    if review_data.option_b is not None:
        question.option_b = review_data.option_b
    if review_data.option_c is not None:
        question.option_c = review_data.option_c
    if review_data.option_d is not None:
        question.option_d = review_data.option_d
    if review_data.correct_option is not None:
        question.correct_option = review_data.correct_option.strip().upper()
    if review_data.explanation is not None:
        question.explanation = review_data.explanation
    if review_data.competency_tag is not None:
        question.competency_tag = review_data.competency_tag
    if review_data.difficulty is not None:
        question.difficulty = review_data.difficulty

    db.commit()
    db.refresh(question)
    return question


@router.post("/questions/bulk-review")
def bulk_review_questions(
    request: BulkReviewRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Bulk approve or reject multiple questions at once.
    """
    action_upper = request.action.upper()
    if action_upper not in ["APPROVE", "REJECT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be APPROVE or REJECT."
        )

    target_status = "APPROVED" if action_upper == "APPROVE" else "REJECTED"

    questions = db.query(Question).filter(Question.id.in_(request.question_ids)).all()
    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching questions found")

    updated_count = 0
    for q in questions:
        q.review_status = target_status
        q.reviewed_by_id = admin_user.id
        if request.notes:
            q.reviewer_notes = request.notes
        updated_count += 1

    db.commit()
    return {
        "message": f"Successfully updated {updated_count} questions to {target_status}",
        "updated_count": updated_count,
        "status": target_status
    }
