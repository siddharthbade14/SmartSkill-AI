import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_learner
from app.db.session import get_db
from app.models.assessment import AssessmentAttempt, AssessmentAnswer
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.assessment import (
    AssessmentSubmission,
    AssessmentResultResponse,
    AnswerResultDetail,
    AttemptSummaryResponse
)
from app.schemas.quiz import QuizLearnerDetailResponse, QuizResponse
from app.services.recommendation_service import recommendation_service

router = APIRouter()


@router.get("/available", response_model=List[QuizResponse])
def get_available_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_learner)
):
    """
    List all active, published quizzes ready for learner assessment.
    """
    quizzes = db.query(Quiz).filter(Quiz.status == "PUBLISHED").order_by(Quiz.created_at.desc()).all()
    result = []
    for q in quizzes:
        approved_count = sum(1 for item in q.questions if item.review_status == "APPROVED")
        if approved_count > 0:
            result.append(
                QuizResponse(
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
                    total_questions=approved_count,
                    approved_questions=approved_count,
                    pending_questions=0
                )
            )
    return result


@router.get("/{quiz_id}/start", response_model=QuizLearnerDetailResponse)
def start_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_learner)
):
    """
    Start an assessment session. Returns approved questions without answers or explanations.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.status == "PUBLISHED").first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published quiz not found")

    approved_questions = [q for q in quiz.questions if q.review_status == "APPROVED"]
    if not approved_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz does not have any approved questions yet."
        )

    return QuizLearnerDetailResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        document_id=quiz.document_id,
        status=quiz.status,
        target_competency=quiz.target_competency,
        time_limit_minutes=quiz.time_limit_minutes,
        passing_percentage=quiz.passing_percentage,
        questions=approved_questions
    )


@router.post("/{quiz_id}/submit", response_model=AssessmentResultResponse)
def submit_quiz(
    quiz_id: int,
    submission: AssessmentSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_learner)
):
    """
    Submit assessment answers in real-time.
    Calculates instant score, assesses competency gaps, and outputs personalized iGOT recommendations.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    approved_questions = {q.id: q for q in quiz.questions if q.review_status == "APPROVED"}
    if not approved_questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No approved questions found for this quiz.")

    total_questions = len(approved_questions)
    correct_count = 0
    detailed_answers: List[AnswerResultDetail] = []
    answers_for_eval = []

    # Map submissions by question_id
    user_answers_map = {ans.question_id: ans.selected_option.strip().upper() for ans in submission.answers}

    for q_id, question in approved_questions.items():
        selected = user_answers_map.get(q_id, "NONE")
        is_correct = (selected == question.correct_option.strip().upper())
        if is_correct:
            correct_count += 1

        detailed_answers.append(
            AnswerResultDetail(
                question_id=question.id,
                question_text=question.question_text,
                selected_option=selected,
                correct_option=question.correct_option,
                is_correct=is_correct,
                explanation=question.explanation,
                competency_tag=question.competency_tag,
                source_reference=question.source_reference
            )
        )

        answers_for_eval.append({
            "question_id": question.id,
            "competency_tag": question.competency_tag,
            "is_correct": is_correct
        })

    # Calculate metrics
    percentage = round((correct_count / total_questions) * 100.0, 1) if total_questions > 0 else 0.0
    passed = percentage >= quiz.passing_percentage

    # Evaluate granular competency breakdown and generate iGOT course recommendations
    competency_scores, recommendations = recommendation_service.evaluate_competencies_and_recommend(answers_for_eval)

    # Persist attempt
    attempt = AssessmentAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=correct_count,
        total_questions=total_questions,
        percentage=percentage,
        passed=passed,
        time_spent_seconds=submission.time_spent_seconds,
        competency_breakdown_json=json.dumps([c.model_dump() for c in competency_scores]),
        recommendations_json=json.dumps([r.model_dump() for r in recommendations])
    )
    db.add(attempt)
    db.flush()

    # Save detailed answers
    for detail in detailed_answers:
        ans_record = AssessmentAnswer(
            attempt_id=attempt.id,
            question_id=detail.question_id,
            selected_option=detail.selected_option,
            is_correct=detail.is_correct
        )
        db.add(ans_record)

    db.commit()
    db.refresh(attempt)

    return AssessmentResultResponse(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        score=correct_count,
        total_questions=total_questions,
        percentage=percentage,
        passed=passed,
        time_spent_seconds=submission.time_spent_seconds,
        completed_at=attempt.completed_at,
        competency_breakdown=competency_scores,
        recommendations=recommendations,
        detailed_answers=detailed_answers
    )


@router.get("/attempts", response_model=List[AttemptSummaryResponse])
def get_user_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_learner)
):
    """
    List previous assessment attempts and scores for the current user.
    """
    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id
    ).order_by(AssessmentAttempt.completed_at.desc()).all()

    result = []
    for att in attempts:
        result.append(
            AttemptSummaryResponse(
                id=att.id,
                quiz_id=att.quiz_id,
                quiz_title=att.quiz.title if att.quiz else "Government Assessment",
                score=att.score,
                total_questions=att.total_questions,
                percentage=att.percentage,
                passed=att.passed,
                time_spent_seconds=att.time_spent_seconds,
                completed_at=att.completed_at
            )
        )
    return result


@router.get("/attempts/{attempt_id}", response_model=AssessmentResultResponse)
def get_attempt_detail(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve full assessment result, competency breakdown, and iGOT recommendations for an attempt.
    """
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment attempt not found")

    # Authorize: user can view own attempt, or admin can view any attempt
    if current_user.role != "admin" and attempt.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    competency_breakdown = json.loads(attempt.competency_breakdown_json or "[]")
    recommendations = json.loads(attempt.recommendations_json or "[]")

    detailed_answers = []
    for ans in attempt.answers:
        q = ans.question
        if q:
            detailed_answers.append(
                AnswerResultDetail(
                    question_id=q.id,
                    question_text=q.question_text,
                    selected_option=ans.selected_option,
                    correct_option=q.correct_option,
                    is_correct=ans.is_correct,
                    explanation=q.explanation,
                    competency_tag=q.competency_tag,
                    source_reference=q.source_reference
                )
            )

    return AssessmentResultResponse(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        quiz_title=attempt.quiz.title if attempt.quiz else "Assessment",
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=attempt.percentage,
        passed=attempt.passed,
        time_spent_seconds=attempt.time_spent_seconds,
        completed_at=attempt.completed_at,
        competency_breakdown=competency_breakdown,
        recommendations=recommendations,
        detailed_answers=detailed_answers
    )
