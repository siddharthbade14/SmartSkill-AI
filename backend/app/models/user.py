from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="learner", nullable=False)  # "admin" (Trainer/Reviewer) or "learner" (Trainee/Officer)
    department = Column(String(255), default="Ministry of Statistics and Programme Implementation (MoSPI)")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    documents = relationship("Document", back_populates="uploader", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="creator", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="user", cascade="all, delete-orphan")
