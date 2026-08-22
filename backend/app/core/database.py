import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("dayflow.database")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        try:
            engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            # Test connection
            with engine.connect() as conn:
                pass
            logger.info("Successfully connected to PostgreSQL database.")
            return engine
        except Exception as e:
            logger.warning(f"Failed to connect to PostgreSQL ({e}). Falling back to SQLite database for hackathon evaluation resilience.")
            fallback_url = "sqlite:///./dayflow.db"
            return create_engine(fallback_url, connect_args={"check_same_thread": False})
    else:
        return create_engine(db_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
