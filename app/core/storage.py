import os
from functools import lru_cache

import requests
from google.api_core.exceptions import GoogleAPICallError, NotFound, RetryError
from google.auth.exceptions import GoogleAuthError
from google.cloud import storage

from app.core.config import settings

# Everything that can go wrong when talking to GCS: an API error (403, 404, 5xx),
# retries exhausted, bad credentials, or the network being down. Routes catch this tuple.
STORAGE_ERRORS = (GoogleAPICallError, RetryError, GoogleAuthError, requests.exceptions.RequestException)

TIMEOUT_SECONDS = 60


@lru_cache(maxsize=1)
def _client() -> storage.Client:
    """Build the GCS client once, on first use.

    With a key file we authenticate as that service account. Without one, the library falls back to
    Application Default Credentials: on Cloud Run or GCE that is the service account attached to the
    service itself, so production needs no key file at all.
    """
    project = settings.GCP_PROJECT_ID or None
    if settings.GOOGLE_CREDENTIALS_FILE:
        path = os.path.expanduser(settings.GOOGLE_CREDENTIALS_FILE)
        return storage.Client.from_service_account_json(path, project=project)
    return storage.Client(project=project)


def _blob(key: str) -> storage.Blob:
    # bucket() and blob() only build local objects; no network call happens until we use them
    return _client().bucket(settings.GCS_BUCKET_NAME).blob(key)


def check_storage_access() -> None:
    """Run once at startup: prove the credentials work and the bucket is reachable.

    Listing one object needs only object-level permission, which is all our service account has
    (it cannot read bucket settings), so this check works with a least-privilege role.
    """
    try:
        next(iter(_client().list_blobs(settings.GCS_BUCKET_NAME, max_results=1, timeout=TIMEOUT_SECONDS)), None)
    except STORAGE_ERRORS as e:
        raise RuntimeError(f"Cannot access bucket '{settings.GCS_BUCKET_NAME}': {e}") from e


def put_object(key: str, data: bytes, content_type: str) -> None:
    _blob(key).upload_from_string(data, content_type=content_type, timeout=TIMEOUT_SECONDS)


def get_object_bytes(key: str) -> bytes:
    """Used by the parsing step: read an object back into memory."""
    return _blob(key).download_as_bytes(timeout=TIMEOUT_SECONDS)


def remove_object(key: str) -> None:
    try:
        _blob(key).delete(timeout=TIMEOUT_SECONDS)
    except NotFound:
        pass  # already gone, which is the state we wanted
