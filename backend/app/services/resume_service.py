import re
from typing import Optional


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text("text"))
        doc.close()
        return "\n".join(text_parts).strip()
    except ImportError:
        return "[PDF parsing unavailable — install PyMuPDF]"
    except Exception as e:
        return f"[Error parsing PDF: {str(e)}]"


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        import docx
        import io

        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except ImportError:
        return "[DOCX parsing unavailable — install python-docx]"
    except Exception as e:
        return f"[Error parsing DOCX: {str(e)}]"


def extract_email(text: str) -> Optional[str]:
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    match = re.search(
        r"[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{4,6}", text
    )
    return match.group(0) if match else None


def parse_resume_file(file_bytes: bytes, content_type: str) -> str:
    if "pdf" in content_type:
        return extract_text_from_pdf(file_bytes)
    elif "docx" in content_type or "word" in content_type:
        return extract_text_from_docx(file_bytes)
    elif "text" in content_type:
        return file_bytes.decode("utf-8", errors="ignore")
    return "[Unsupported file format. Please upload PDF or DOCX.]"
