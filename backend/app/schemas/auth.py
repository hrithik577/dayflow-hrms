import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "EMPLOYEE"
    employee_code: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = "Employee"

    @field_validator('password')
    @classmethod
    def validate_password_rules(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter (A-Z)')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter (a-z)')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number (0-9)')
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>/?]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*...)')
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    employee_id: Optional[str] = None
    email: str
    role: str
    email_verified: bool
    is_active: bool
    employee_details: Optional[dict] = None

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
