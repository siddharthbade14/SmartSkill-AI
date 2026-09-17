from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.question import QuestionLearnerResponse, QuestionAdminResponse


class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_competency: str = "Statistical Methodology & Data Governance"
    time_limit_minutes: int = 15
    passing_percentage: int = 70


class QuizCreate(QuizBase):
    document_id: Optional[int] = None


class QuizGenerateRequest(BaseModel):
    document_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    num_questions: int = 5
    target_competency: Optional[str] = "Statistical Methodology & Data Governance"
    difficulty: Optional[str] = "Intermediate"


class QuizResponse(QuizBase):
    id: int
    document_id: Optional[int] = None
    status: str
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    total_questions: int = 0
    approved_questions: int = 0
    pending_questions: int = 0

    model_config = ConfigDict(from_attributes=True)


class QuizLearnerDetailResponse(QuizBase):
    id: int
    document_id: Optional[int] = None
    status: str
    time_limit_minutes: int
    passing_percentage: int
    questions: List[QuestionLearnerResponse] = []

    model_config = ConfigDict(from_attributes=True)


class QuizAdminDetailResponse(QuizBase):
    id: int
    document_id: Optional[int] = None
    status: str
    time_limit_minutes: int
    passing_percentage: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionAdminResponse] = []

    model_config = ConfigDict(from_attributes=True)
