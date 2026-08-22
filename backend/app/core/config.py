import os
from typing import List

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        PROJECT_NAME: str = "Dayflow HR Platform"
        ENV: str = "development"
        SECRET_KEY: str = "dayflow-super-secret-key-change-in-production-2026"
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

        DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/dayflow"
        
        GEMINI_API_KEY: str = ""
        OPENAI_API_KEY: str = ""

        ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

        @property
        def cors_origins(self) -> List[str]:
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

        class Config:
            env_file = ".env"
            extra = "ignore"

    settings = Settings()

except ImportError:
    class Settings:
        PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Dayflow HR Platform")
        ENV: str = os.getenv("ENV", "development")
        SECRET_KEY: str = os.getenv("SECRET_KEY", "dayflow-super-secret-key-change-in-production-2026")
        ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

        DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/dayflow")
        
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

        ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")

        @property
        def cors_origins(self) -> List[str]:
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    settings = Settings()

