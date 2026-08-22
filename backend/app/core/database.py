import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("dayflow.database")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("sqlite"):
            engine = create_engine(db_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
        else:
            engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
        logger.info(f"Successfully connected to database ({db_url}).")
        return engine
    except Exception as e:
        logger.warning(f"Failed to connect to primary DB at {db_url}: {e}. Falling back to local SQLite.")
        sqlite_url = "sqlite:///./dayflow.db"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
        return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
