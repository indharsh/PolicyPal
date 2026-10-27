from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    """What the API reveals about a document.

    stored_filename and file_hash are deliberately missing: they are internal details,
    and response_model strips any field that is not declared here.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    content_type: str
    size_bytes: int
    category: str
    status: str
    summary: Optional[str] = None
    page_count: Optional[int] = None
    created_time: datetime
