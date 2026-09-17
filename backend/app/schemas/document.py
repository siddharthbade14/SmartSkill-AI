from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    title: str


class DocumentResponse(DocumentBase):
    id: int
    filename: str
    file_size_bytes: int
    page_count: int
    uploaded_by_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailResponse(DocumentResponse):
    extracted_text: Optional[str] = None
    extracted_tables_json: Optional[str] = None
    text_preview: Optional[str] = None
