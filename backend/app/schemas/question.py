from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class GeneratedMCQSchema(BaseModel):
    question_text: str = Field(description="The multiple choice question text based strictly on the manual")
    option_a: str = Field(description="Option A text")
    option_b: str = Field(description="Option B text")
    option_c: str = Field(description="Option C text")
    option_d: str = Field(description="Option D text")
    correct_option: str = Field(description="The correct option letter: A, B, C, or D")
    explanation: str = Field(description="In-depth pedagogical explanation citing specific concepts or data from the manual")
    competency_tag: str = Field(description="Target government competency domain (e.g. Sampling Methodology, National Accounts, Data Verification)")
    difficulty: str = Field(default="Intermediate", description="Beginner, Intermediate, or Advanced")
    source_reference: str = Field(description="Manual section, table title, or page reference for grounded verification")


class GeneratedMCQListSchema(BaseModel):
    questions: List[GeneratedMCQSchema]


class QuestionBase(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    competency_tag: str = "General Statistics"
    difficulty: str = "Intermediate"
    source_reference: Optional[str] = "Government Manual Reference"


class QuestionCreate(QuestionBase):
    correct_option: str
    explanation: str
    quiz_id: int


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    competency_tag: Optional[str] = None
    difficulty: Optional[str] = None
    source_reference: Optional[str] = None
    review_status: Optional[str] = None
    reviewer_notes: Optional[str] = None


class QuestionReviewUpdate(BaseModel):
    review_status: str  # "APPROVED", "REJECTED", "MODIFIED"
    reviewer_notes: Optional[str] = None
    # Optional modified fields if reviewer also edited the question text
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    competency_tag: Optional[str] = None
    difficulty: Optional[str] = None


class BulkReviewRequest(BaseModel):
    question_ids: List[int]
    action: str  # "APPROVE" or "REJECT"
    notes: Optional[str] = None


# Learner view: excludes correct_option and explanation during active quiz
class QuestionLearnerResponse(QuestionBase):
    id: int
    quiz_id: int

    model_config = ConfigDict(from_attributes=True)


# Admin / HITL view: includes correct_option, explanation, review_status, reviewer_notes
class QuestionAdminResponse(QuestionBase):
    id: int
    quiz_id: int
    correct_option: str
    explanation: str
    review_status: str
    reviewer_notes: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
