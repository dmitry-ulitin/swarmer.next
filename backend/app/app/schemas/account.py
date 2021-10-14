from datetime import datetime
from typing import List
from pydantic import BaseModel
from .user import User

class AccountBase(BaseModel):
    name: str = None
    currency: str
    deleted: bool = False

class AccountCreate(AccountBase):
    pass

class AccountUpdate(AccountBase):
    pass


class Account(AccountBase):
    id: int
    group_id: int
    created: datetime
    updated: datetime

    class Config:
        orm_mode = True

class AccountGroupBase(BaseModel):
    name: str
    deleted: bool = False

class AccountGroupCreate(AccountGroupBase):
    pass

class AccountGroupUpdate(AccountGroupBase):
    pass

class AccountGroup(AccountGroupBase):
    id: int
    user_id: int
    user: User
    created: datetime
    updated: datetime
    accounts: List[Account] = []

    class Config:
        orm_mode = True
