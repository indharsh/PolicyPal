from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "PolicyPal"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    #CORS - which frontend domains are allowed to make requests to the backend
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"]
    DATABASE_URL: str
    SECRET_KEY: str

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Object storage (MinIO). The keys have no default on purpose: the app must not start without them.
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str = "policypal-documents"
    MINIO_SECURE: bool = False  # True when the endpoint is https (always True for hosted services)
    MINIO_REGION: str = ""      # hosted services often need one, e.g. "auto" for Cloudflare R2

    MAX_UPLOAD_SIZE_MB: int = 20

    class Config:
        env_file = ".env"

settings = Settings()