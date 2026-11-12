from sqlalchemy import Column, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class DocumentPage(Base):
    """The text extracted from one page of a document.

    Storing it means we parse a file once. Later steps (chunking, embedding, citations that say
    "page 12") read from here instead of re-reading the original file from storage.
    Formats with no real pages (Word, text) are stored as a single page numbered 1.
    """
    __tablename__ = "document_page"
    __table_args__ = (
        UniqueConstraint("document_id", "page_number", name="uq_document_page_number"),
    )

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("user_document.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

    document = relationship("UserDocument", back_populates="pages")
