import json
import logging
import os
import re
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class PDFProcessingService:
    """
    Multi-tier PDF Ingestion Pipeline for complex government manuals.
    Extracts high-fidelity prose and structured tabular matrices.
    """

    @staticmethod
    def extract_from_pdf(file_path: str) -> Dict[str, Any]:
        """
        Extracts both narrative text and tabular structures from a PDF file.
        Returns a dictionary with full_text, page_count, and extracted_tables.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at: {file_path}")

        extracted_text_pages: List[str] = []
        extracted_tables: List[Dict[str, Any]] = []
        page_count = 0

        # Tier 1: Try pdfplumber for high-accuracy text and tabular layout
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                page_count = len(pdf.pages)
                for page_idx, page in enumerate(pdf.pages, start=1):
                    # 1. Extract text
                    page_text = page.extract_text(layout=True) or page.extract_text() or ""
                    clean_page = PDFProcessingService._clean_text(page_text)
                    if clean_page:
                        extracted_text_pages.append(f"--- Page {page_idx} ---\n" + clean_page)
                    
                    # 2. Extract tables
                    tables = page.extract_tables()
                    for t_idx, table in enumerate(tables):
                        clean_table = PDFProcessingService._normalize_table(table)
                        if clean_table and len(clean_table) > 1:
                            extracted_tables.append({
                                "page": page_idx,
                                "table_index": t_idx + 1,
                                "headers": clean_table[0],
                                "rows": clean_table[1:]
                            })
        except Exception as e:
            logger.warning(f"pdfplumber extraction encountered an issue: {e}. Falling back to pypdf.")
            # Tier 2: pypdf fallback
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                page_count = len(reader.pages)
                for page_idx, page in enumerate(reader.pages, start=1):
                    page_text = page.extract_text() or ""
                    clean_page = PDFProcessingService._clean_text(page_text)
                    if clean_page:
                        extracted_text_pages.append(f"--- Page {page_idx} ---\n" + clean_page)
            except Exception as e2:
                logger.error(f"pypdf extraction also failed: {e2}")
                raise RuntimeError(f"Could not extract content from PDF: {e2}")

        combined_text = "\n\n".join(extracted_text_pages)
        
        # If document is plain text or tabular data was extracted, append table summaries
        if extracted_tables:
            table_summary = "\n\n--- EXTRACTED GOVERNMENT DATA TABLES ---\n"
            for t in extracted_tables:
                table_summary += f"\nTable on Page {t['page']} (Index {t['table_index']}):\n"
                table_summary += " | ".join(str(h) for h in t["headers"]) + "\n"
                for r in t["rows"][:5]:  # include first few representative rows
                    table_summary += " | ".join(str(c) for c in r) + "\n"
            combined_text += table_summary

        return {
            "page_count": page_count,
            "full_text": combined_text.strip(),
            "tables": extracted_tables,
            "tables_json": json.dumps(extracted_tables, ensure_ascii=False)
        }

    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Cleans repetitive government headers, footers, and redundant line breaks.
        """
        if not text:
            return ""
        # Remove standard government document page number footers (e.g. Page 12 of 150)
        cleaned = re.sub(r"Page\s+\d+\s+of\s+\d+", "", text, flags=re.IGNORECASE)
        # Remove excessive whitespace while preserving paragraph structure
        lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
        return "\n".join(lines)

    @staticmethod
    def _normalize_table(table: List[List[Any]]) -> List[List[str]]:
        """
        Cleans table cells, strips None values and trailing whitespace.
        """
        if not table:
            return []
        cleaned_table = []
        for row in table:
            if not row or all(cell is None or str(cell).strip() == "" for cell in row):
                continue
            cleaned_row = [str(cell).strip() if cell is not None else "" for cell in row]
            cleaned_table.append(cleaned_row)
        return cleaned_table


pdf_service = PDFProcessingService()
