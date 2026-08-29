from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as analysis_router
from app.core.database import Base, engine

# Import models so SQLAlchemy knows about them
from app.models.schema import Schema


# ============================================================
# Create database tables
# ============================================================

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# Create FastAPI application
# ============================================================

app = FastAPI(
    title="AI Image Quality Detection API",
    description=(
        "AI-powered image quality and defect detection "
        "backend."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Routes
# ============================================================

app.include_router(
    analysis_router
)

# ============================================================
# Health check
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AI Image Quality Detection API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "online",
    }