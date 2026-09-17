import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin, get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.services.pdf_service import pdf_service

router = APIRouter()


@router.post("/upload", response_model=DocumentDetailResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Upload a government statistical manual or policy PDF.
    Extracts text and tabular content via the OCR / PDF parsing pipeline.
    """
    if not file.filename.lower().endswith((".pdf", ".txt", ".md")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF, TXT, or Markdown document.",
        )

    # Sanitize filename
    safe_filename = f"{admin_user.id}_{int(os.times().elapsed)}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Save to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Extract content
    extracted_text = ""
    extracted_tables_json = "[]"
    page_count = 1

    try:
        if file.filename.lower().endswith(".pdf"):
            extraction = pdf_service.extract_from_pdf(file_path)
            extracted_text = extraction["full_text"]
            extracted_tables_json = extraction["tables_json"]
            page_count = extraction["page_count"]
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"PDF extraction failed: {str(e)}"
        )

    # Save record to DB
    doc = Document(
        title=title,
        filename=file.filename,
        file_path=file_path,
        file_size_bytes=file_size,
        page_count=page_count,
        extracted_text=extracted_text,
        extracted_tables_json=extracted_tables_json,
        uploaded_by_id=admin_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentDetailResponse(
        id=doc.id,
        title=doc.title,
        filename=doc.filename,
        file_size_bytes=doc.file_size_bytes,
        page_count=doc.page_count,
        uploaded_by_id=doc.uploaded_by_id,
        created_at=doc.created_at,
        extracted_text=doc.extracted_text,
        extracted_tables_json=doc.extracted_tables_json,
        text_preview=doc.extracted_text[:500] if doc.extracted_text else ""
    )


@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all uploaded government manuals available in the repository.
    """
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return docs


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve full extracted content and table structure for a document.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    return DocumentDetailResponse(
        id=doc.id,
        title=doc.title,
        filename=doc.filename,
        file_size_bytes=doc.file_size_bytes,
        page_count=doc.page_count,
        uploaded_by_id=doc.uploaded_by_id,
        created_at=doc.created_at,
        extracted_text=doc.extracted_text,
        extracted_tables_json=doc.extracted_tables_json,
        text_preview=doc.extracted_text[:500] if doc.extracted_text else ""
    )


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    Permanently delete an uploaded manual and its file on disk.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Clean up file on disk if exists
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    return {"success": True, "message": f"Document '{doc.filename}' deleted successfully.", "deleted_document_id": document_id}
