import logging

from app.core import storage
from app.core.database import sessionLocal
from app.core.filetypes import KIND_BY_CONTENT_TYPE
from app.models.document import DocumentStatus, UserDocument
from app.models.document_page import DocumentPage
from app.services.extractors import ExtractionError, extract

logger = logging.getLogger("policypal.pipeline")


def _mark_failed(db, doc_id: int, message: str) -> None:
    db.rollback()  # throw away any half-finished work from the failed attempt
    doc = db.get(UserDocument, doc_id)
    if doc is not None:  # the user may have deleted the document while we were working
        doc.status = DocumentStatus.failed.value
        doc.error_message = message
        db.commit()


def process_document(doc_id: int) -> None:
    """Turn an uploaded file into searchable text. Runs in the background after the upload response.

    It opens its OWN database session: the session that served the upload request is closed
    as soon as the response is sent, so it cannot be reused here.
    """
    db = sessionLocal()
    try:
        doc = db.get(UserDocument, doc_id)
        if doc is None:
            return
        doc.status = DocumentStatus.processing.value
        doc.error_message = None
        db.commit()

        data = storage.get_object_bytes(f"{doc.user_id}/{doc.stored_filename}")
        result = extract(KIND_BY_CONTENT_TYPE[doc.content_type].key, data)

        db.query(DocumentPage).filter(DocumentPage.document_id == doc.id).delete()
        db.add_all(DocumentPage(document_id=doc.id, page_number=p.number, text=p.text) for p in result.pages)
        doc.page_count = result.page_count
        # Later steps (chunking, embeddings, vector index) will run here, before "ready"
        doc.status = DocumentStatus.ready.value
        db.commit()
    except ExtractionError as e:
        _mark_failed(db, doc_id, str(e))
    except storage.STORAGE_ERRORS:
        logger.exception("Storage error while processing document %s", doc_id)
        _mark_failed(db, doc_id, "Could not read the file from storage. Please try again.")
    except Exception:
        logger.exception("Unexpected error while processing document %s", doc_id)
        _mark_failed(db, doc_id, "Something went wrong while processing this document.")
    finally:
        db.close()
