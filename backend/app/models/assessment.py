from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, default=0, nullable=False)
    total_questions = Column(Integer, default=0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    time_spent_seconds = Column(Integer, default=0)
    
    # Granular analytics and recommendations
    competency_breakdown_json = Column(Text, nullable=True)  # Stores JSON with domain -> {correct, total, percentage, status}
    recommendations_json = Column(Text, nullable=True)       # Stores JSON with curated iGOT courses
    
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("AssessmentAnswer", back_populates="attempt", cascade="all, delete-orphan")


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option = Column(String(5), nullable=False)  # "A", "B", "C", "D"
    is_correct = Column(Boolean, default=False, nullable=False)

    # Relationships
    attempt = relationship("AssessmentAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")
