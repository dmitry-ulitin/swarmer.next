from datetime import datetime
from typing import List
from pydantic import BaseModel

class AccountBase(BaseModel):
    name: str
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
    owner_id: int
    created: datetime
    updated: datetime
    items: List[Account] = []

    class Config:
        orm_mode = True
