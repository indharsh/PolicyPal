import io

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

# One client for the whole app. It is just configuration (endpoint + credentials);
# every call makes its own HTTP request to MinIO, so sharing it is safe.
client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
    region=settings.MINIO_REGION or None,  # giving a region skips an extra region-lookup request
)


def ensure_bucket() -> None:
    """Check the bucket is reachable at app startup. Creates it if missing (works on local MinIO).

    On hosted services create the bucket in their dashboard first: the access key we give the
    app is deliberately limited to reading and writing objects, and cannot create buckets.
    """
    try:
        exists = client.bucket_exists(settings.MINIO_BUCKET)
    except S3Error as e:
        raise RuntimeError(f"Cannot access bucket '{settings.MINIO_BUCKET}' ({e.code}). Check the MINIO_* settings.") from e
    if not exists:
        client.make_bucket(settings.MINIO_BUCKET)


def put_object(key: str, data: bytes, content_type: str) -> None:
    client.put_object(
        settings.MINIO_BUCKET,
        key,
        io.BytesIO(data),  # put_object wants a file-like stream plus its exact length
        length=len(data),
        content_type=content_type,
    )


def get_object_bytes(key: str) -> bytes:
    """Used by the PDF-parsing step: read an object back into memory."""
    response = client.get_object(settings.MINIO_BUCKET, key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()  # hand the HTTP connection back to the pool


def remove_object(key: str) -> None:
    client.remove_object(settings.MINIO_BUCKET, key)  # no error if the key is already gone
