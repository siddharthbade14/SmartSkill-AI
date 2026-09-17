from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: str  # "A", "B", "C", "D"


class AssessmentSubmission(BaseModel):
    time_spent_seconds: int = 0
    answers: List[AnswerSubmission]


class CompetencyScore(BaseModel):
    competency: str
    total: int
    correct: int
    percentage: float
    status: str  # "Mastered" (>=80%), "Competent" (>=60%), "Needs Revision" (<60%)


class CourseRecommendation(BaseModel):
    course_id: str
    title: str
    provider: str = "iGOT Karmayogi"
    duration: str
    competency: str
    reason: str
    url: str


class AnswerResultDetail(BaseModel):
    question_id: int
    question_text: str
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: str
    competency_tag: str
    source_reference: Optional[str] = None


class AssessmentResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    score: int
    total_questions: int
    percentage: float
    passed: bool
    time_spent_seconds: int
    completed_at: datetime
    competency_breakdown: List[CompetencyScore]
    recommendations: List[CourseRecommendation]
    detailed_answers: List[AnswerResultDetail]

    model_config = ConfigDict(from_attributes=True)


class AttemptSummaryResponse(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    score: int
    total_questions: int
    percentage: float
    passed: bool
    time_spent_seconds: int
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)
