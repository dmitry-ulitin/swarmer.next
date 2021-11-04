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
    deleted: bool = False


class Account(AccountBase):
    id: int
    fullname: str
    deleted: bool

    class Config:
        orm_mode = True

class ACLBase(BaseModel):
    is_admin: bool
    is_readonly: bool
    name: str = None
    order: int = 0

class ACLCreate(ACLBase):
    pass

class ACLUpdate(ACLBase):
    deleted: bool = False

class ACL(ACLBase):
    deleted: bool
    user: User

    class Config:
        orm_mode = True

class AccountGroupBase(BaseModel):
    name: str
    owner_id: int

class AccountGroupCreate(AccountGroupBase):
    pass

class AccountGroupUpdate(AccountGroupBase):
    deleted: bool = False

class AccountGroup(AccountGroupBase):
    id: int
    fullname: str
    is_owner: bool
    is_coowner: bool
    is_shared: bool
    order: int
    deleted: bool
    owner: User
    accounts: List[Account] = []
    permissions: List[ACL] = []

    class Config:
        orm_mode = True
