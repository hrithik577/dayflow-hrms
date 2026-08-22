from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[int] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[int] = None


class DepartmentOut(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
