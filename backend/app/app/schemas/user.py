from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    name: str
    currency: str = "RUB"
    is_active: bool = True


class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    pass

class User(UserBase):
    id: int
    created: datetime
    updated: datetime

    class Config:
        orm_mode = True