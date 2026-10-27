from sqlalchemy import Column, Integer, String, DateTime, Boolean, BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
from sqlalchemy import Text


class DocumentStatus(str, enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class DocumentCategory(str, enum.Enum):
    hr = "hr"
    health = "health"
    life = "life"
    term = "term"
    car = "car"
    other = "other"


class UserDocument(Base):
    __tablename__ = "user_document"
    __table_args__ = (
        UniqueConstraint("user_id", "file_hash", name="uq_documents_user_file_hash"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, index =True)
    content_type = Column(String, nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    file_hash = Column(String, nullable=False)
    category = Column(String, nullable=False, default=DocumentCategory.other.value, index=True)
    status = Column(String, nullable=False, default=DocumentStatus.uploaded.value, index=True)
    summary = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_time = Column(DateTime(timezone=True), server_default=func.now())
    modified_time = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="documents") 