from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel
from .user import User

class AccountBase(BaseModel):
    fullname: str = None
    currency: str
    start_balance: Decimal = None
    deleted: bool = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(AccountBase):
    id: int

class Account(AccountBase):
    id: int
    balance: Decimal

    class Config:
        orm_mode = True

class ACLBase(BaseModel):
    user: User
    is_admin: bool
    is_readonly: bool

class ACLCreate(ACLBase):
    pass

class ACLUpdate(ACLBase):
    pass

class ACL(ACLBase):
    class Config:
        orm_mode = True

class AccountGroupBase(BaseModel):
    fullname: str
    deleted: bool = None

class AccountGroupCreate(AccountGroupBase):
    accounts: List[AccountCreate] = []
    permissions: List[ACLCreate] = []

class AccountGroupUpdate(AccountGroupBase):
    id: int
    accounts: List[AccountUpdate] = []
    permissions: List[ACLUpdate] = []

class AccountGroup(AccountGroupBase):
    id: int
    is_owner: bool
    is_coowner: bool
    is_shared: bool
    accounts: List[Account] = []
    permissions: List[ACL] = []

    class Config:
        orm_mode = True
