import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("dayflow.database")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to PostgreSQL database.")
        return engine
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL database at {db_url}: {e}")
        raise RuntimeError(f"PostgreSQL connection failed: {e}")

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
