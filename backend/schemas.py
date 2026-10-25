from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field

Status = Literal["Applied", "Interview", "Offer", "Rejected"]


class UserCreate(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=6)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class JobCreate(BaseModel):
    company: str = Field(min_length=1)
    role: str = Field(min_length=1)
    status: Status = "Applied"
    applied_date: Optional[date] = None
    notes: str = ""


class JobUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[Status] = None
    applied_date: Optional[date] = None
    notes: Optional[str] = None


class JobOut(JobCreate):
    id: int
    model_config = {"from_attributes": True}
