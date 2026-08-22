from pydantic import BaseModel, EmailStr
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "EMPLOYEE"
    employee_code: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = "Employee"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    employee_id: str
    email: str
    role: str
    email_verified: bool
    is_active: bool
    employee_details: Optional[dict] = None

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
