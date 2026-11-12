import io
import zipfile
from dataclasses import dataclass
from typing import Optional

import pymupdf
from docx import Document as load_docx

MAX_DOCX_UNPACKED_BYTES = 200 * 1024 * 1024  # a DOCX is a ZIP; refuse ones that unpack to a huge size


class ExtractionError(Exception):
    """The file is valid but we cannot get usable text out of it. The message is shown to the user."""


@dataclass
class ExtractedPage:
    number: int  # 1-based
    text: str


@dataclass
class ExtractionResult:
    pages: list[ExtractedPage]    # only pages that contain text
    page_count: Optional[int]     # real page count, or None for formats without pages


def _clean(text: str) -> str:
    # PostgreSQL TEXT columns cannot hold the NUL character, and PDFs sometimes produce it
    return text.replace("\x00", "").strip()


def _extract_pdf(data: bytes) -> ExtractionResult:
    try:
        doc = pymupdf.open(stream=data, filetype="pdf")
    except Exception as e:
        raise ExtractionError("This PDF is damaged and could not be opened.") from e
    with doc:
        if doc.needs_pass:
            raise ExtractionError("This PDF is password-protected. Remove the password and upload it again.")
        pages = []
        for index, page in enumerate(doc):
            text = _clean(page.get_text("text"))
            if text:
                pages.append(ExtractedPage(index + 1, text))
        page_count = doc.page_count
    if not pages:
        raise ExtractionError(
            "No readable text was found. This looks like a scanned document; "
            "support for scanned files (OCR) is coming."
        )
    return ExtractionResult(pages, page_count)


def _extract_docx(data: bytes) -> ExtractionResult:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            if sum(info.file_size for info in archive.infolist()) > MAX_DOCX_UNPACKED_BYTES:
                raise ExtractionError("This Word file is too large once unpacked.")
        document = load_docx(io.BytesIO(data))
    except ExtractionError:
        raise
    except Exception as e:
        raise ExtractionError("This Word file is damaged and could not be opened.") from e

    parts = []
    # iter_inner_content yields paragraphs and tables in the order they appear in the document
    for block in document.iter_inner_content():
        if hasattr(block, "rows"):  # a table: one line per row, cells separated by " | "
            for row in block.rows:
                line = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if line:
                    parts.append(line)
        elif block.text.strip():
            parts.append(block.text.strip())

    text = _clean("\n".join(parts))
    if not text:
        raise ExtractionError("This Word file contains no text.")
    return ExtractionResult([ExtractedPage(1, text)], None)


def _extract_text(data: bytes) -> ExtractionResult:
    text = _clean(data.decode("utf-8"))
    if not text:
        raise ExtractionError("This file is empty.")
    return ExtractionResult([ExtractedPage(1, text)], None)


# One extractor per file kind. Adding image OCR later means adding one entry here;
# nothing after extraction needs to know which kind of file the text came from.
EXTRACTORS = {
    "pdf": _extract_pdf,
    "docx": _extract_docx,
    "txt": _extract_text,
    "md": _extract_text,
}


def extract(kind_key: str, data: bytes) -> ExtractionResult:
    return EXTRACTORS[kind_key](data)
