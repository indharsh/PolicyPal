from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from sqlalchemy.orm import Session
from sqlalchemy import text
from contextlib import asynccontextmanager
from app.core.storage import ensure_bucket
from app.routes import auth, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_bucket()  # runs once at startup; fails loudly if MinIO is not reachable
    yield


app = FastAPI(lifespan=lifespan, 
    title=settings.APP_NAME, 
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    description="Upload any policy document and get instant, cited answers to your questions.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running"
        }

@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}

