from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import DATABASE_URL


# ---------------------------------------------------------
# PostgreSQL Engine
# ---------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)


# ---------------------------------------------------------
# Database Session
# ---------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------
# Base class for database models
# ---------------------------------------------------------
Base = declarative_base()


# ---------------------------------------------------------
# Database dependency
# ---------------------------------------------------------
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()