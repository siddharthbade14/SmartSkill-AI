from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="UNDER_REVIEW", nullable=False)  # DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED
    target_competency = Column(String(100), default="Statistical Methodology & Data Governance")
    time_limit_minutes = Column(Integer, default=15)
    passing_percentage = Column(Integer, default=70)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    document = relationship("Document", back_populates="quizzes")
    creator = relationship("User", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.id")
    attempts = relationship("AssessmentAttempt", back_populates="quiz", cascade="all, delete-orphan")
