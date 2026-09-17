from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_option = Column(String(5), nullable=False)  # "A", "B", "C", "D"
    explanation = Column(Text, nullable=False)
    competency_tag = Column(String(100), default="General Statistics")
    difficulty = Column(String(50), default="Intermediate")  # "Beginner", "Intermediate", "Advanced"
    source_reference = Column(String(255), default="Government Manual Citation")
    
    # Human-in-the-Loop (HITL) fields
    review_status = Column(String(50), default="PENDING_REVIEW")  # "PENDING_REVIEW", "APPROVED", "REJECTED", "MODIFIED"
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])
    answers = relationship("AssessmentAnswer", back_populates="question", cascade="all, delete-orphan")
