import io
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class FileKind:
    key: str           # short name we store and branch on later, e.g. in the parser step
    extension: str     # what the stored object ends with
    content_type: str  # what we record and send to MinIO


PDF = FileKind("pdf", ".pdf", "application/pdf")
DOCX = FileKind(
    "docx", ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
)
TXT = FileKind("txt", ".txt", "text/plain")
MD = FileKind("md", ".md", "text/markdown")

SUPPORTED_LABEL = "PDF, Word (.docx), or text (.txt, .md)"


def detect_file_kind(data: bytes, filename: str) -> Optional[FileKind]:
    """Decide what a file really is from its CONTENT, not from what the client claims.

    The filename and Content-Type header are typed by the user's browser and can be anything.
    Returns None when the file is not one of the supported kinds.
    """
    # PDF: every PDF starts with the bytes "%PDF-"
    if data.startswith(b"%PDF-"):
        return PDF

    # DOCX is a ZIP archive (starts with "PK\x03\x04") that contains word/document.xml.
    # We only read the archive's file LIST here, we never extract anything at upload time.
    if data.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                if "word/document.xml" in archive.namelist():
                    return DOCX
        except zipfile.BadZipFile:
            pass
        return None

    # Plain text has no magic bytes, so we check the extension AND that the content is real text:
    # no NUL bytes (binary files have them) and valid UTF-8.
    extension = Path(filename).suffix.lower()
    if extension in (".txt", ".md", ".markdown") and b"\x00" not in data:
        try:
            data.decode("utf-8")
        except UnicodeDecodeError:
            return None
        return MD if extension in (".md", ".markdown") else TXT

    return None
