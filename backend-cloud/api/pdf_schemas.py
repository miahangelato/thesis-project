"""Additional schemas for PDF generation."""

from pydantic import BaseModel


class PDFGenerateResponse(BaseModel):
    success: bool
    pdf_url: str
    download_url: str
    qr_code_url: str
    message: str
