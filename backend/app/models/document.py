from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    extracted_text = Column(Text, nullable=True)
    extracted_tables_json = Column(Text, nullable=True)  # JSON string of extracted tabular matrices
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    uploader = relationship("User", back_populates="documents")
    quizzes = relationship("Quiz", back_populates="document", cascade="all, delete-orphan")
