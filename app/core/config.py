import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "DAYFLOW — AI-Native HRMS Data Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dayflow.db")

    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dayflow-secret-key-change-in-production-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7


settings = Settings()
