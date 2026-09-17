import os
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    try:
        engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info(f"Connected successfully to primary database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return engine
    except Exception as e:
        if not db_url.startswith("sqlite"):
            fallback_path = "/tmp/smartskill.db" if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")) else "./smartskill.db"
            logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite: sqlite:///{fallback_path}")
            fallback_url = f"sqlite:///{fallback_path}"
            return create_engine(fallback_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
        raise e

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
