from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel
from .user import User

class AccountBase(BaseModel):
    name: str = None
    currency: str
    start_balance: Decimal

class AccountCreate(AccountBase):
    pass

class AccountUpdate(AccountBase):
    pass

class Account(AccountBase):
    id: int
    fullname: str
    balance: Decimal
    deleted: bool

    class Config:
        orm_mode = True

class ACLBase(BaseModel):
    is_admin: bool
    is_readonly: bool

class ACLCreate(ACLBase):
    pass

class ACLUpdate(ACLBase):
    pass

class ACL(ACLBase):
    user: User

    class Config:
        orm_mode = True

class AccountGroupBase(BaseModel):
    pass

class AccountGroupCreate(AccountGroupBase):
    pass

class AccountGroupUpdate(AccountGroupBase):
    pass

class AccountGroup(AccountGroupBase):
    id: int
    fullname: str
    is_owner: bool
    is_coowner: bool
    is_shared: bool
    accounts: List[Account] = []
    permissions: List[ACL] = []

    class Config:
        orm_mode = True
