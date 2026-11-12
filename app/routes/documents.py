import hashlib
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core import storage
from app.core.deps import get_current_user
from app.core.filetypes import SUPPORTED_LABEL, detect_file_kind
from app.models.document import DocumentCategory, DocumentStatus, UserDocument
from app.models.user import User
from app.schemas.document import DocumentOut, DocumentPageOut
from app.services.pipeline import process_document

router = APIRouter(prefix="/documents", tags=["documents"])


def object_key(user_id: int, stored_filename: str) -> str:
    """The object's name inside the bucket. The user_id prefix groups each user's files together."""
    return f"{user_id}/{stored_filename}"

def get_owned_document(db: Session, doc_id: int, user: User) -> UserDocument:
    """Fetch a document only if it belongs to this user.

    Filtering by user_id IN the query is the isolation rule. A document that exists but belongs
    to someone else gets the same 404 as one that does not exist, so ids cannot be probed.
    """
    doc = (
        db.query(UserDocument)
        .filter(UserDocument.id == doc_id, UserDocument.user_id == user.id)
        .first()
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form(DocumentCategory.other.value),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Validate the category against our enum values
    if category not in {c.value for c in DocumentCategory}:
        raise HTTPException(status_code=422, detail="Unknown category")

    # 2. Read the bytes, but never more than the limit + 1 (so we can tell it was too big)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    data = file.file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File is larger than {settings.MAX_UPLOAD_SIZE_MB} MB")
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")

    # 3. Work out what the file really is from its content (see filetypes.py)
    kind = detect_file_kind(data, file.filename or "")
    if kind is None:
        raise HTTPException(status_code=415, detail=f"Unsupported file. Upload a {SUPPORTED_LABEL} file.")

    # 4. Fingerprint the content, then refuse an exact duplicate for this user
    file_hash = hashlib.sha256(data).hexdigest()
    duplicate = (
        db.query(UserDocument)
        .filter(UserDocument.user_id == current_user.id, UserDocument.file_hash == file_hash)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="You have already uploaded this file")

    # 5. Save to Google Cloud Storage under a random key. The user's filename is never part of the key,
    #    so nothing the user types can steer where the object goes.
    stored_filename = f"{uuid.uuid4().hex}{kind.extension}"
    key = object_key(current_user.id, stored_filename)
    try:
        storage.put_object(key, data, kind.content_type)
    except storage.STORAGE_ERRORS:
        raise HTTPException(status_code=503, detail="File storage is unavailable, try again shortly")

    # 6. Record it in the DB. If that fails, remove the object so storage and DB stay in sync.
    doc = UserDocument(
        user_id=current_user.id,
        original_filename=Path(file.filename or f"document{kind.extension}").name,
        stored_filename=stored_filename,
        content_type=kind.content_type,
        size_bytes=len(data),
        file_hash=file_hash,
        category=category,
        status=DocumentStatus.uploaded.value,
    )
    db.add(doc)
    try:
        db.commit()
    except IntegrityError:  # two identical uploads racing past the check in step 4
        db.rollback()
        storage.remove_object(key)
        raise HTTPException(status_code=409, detail="You have already uploaded this file")
    db.refresh(doc)

    # 7. Hand the slow work (reading the file) to a background task; the user gets their response now
    background_tasks.add_task(process_document, doc.id)
    return doc


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(UserDocument)
        .filter(UserDocument.user_id == current_user.id)
        .order_by(UserDocument.created_time.desc())
        .all()
    )


@router.get("/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_owned_document(db, doc_id, current_user)


@router.get("/{doc_id}/text", response_model=list[DocumentPageOut])
def get_document_text(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """The extracted text, page by page. Useful for checking what the parser actually read."""
    return get_owned_document(db, doc_id, current_user).pages


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = get_owned_document(db, doc_id, current_user)
    try:
        storage.remove_object(object_key(current_user.id, doc.stored_filename))
    except storage.STORAGE_ERRORS:
        # Keep the DB row so we never lose track of an object that still exists
        raise HTTPException(status_code=503, detail="File storage is unavailable, try again shortly")
    db.delete(doc)
    db.commit()
