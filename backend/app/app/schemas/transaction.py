from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

from .category import Category
from .account import Account

class TransactionBase(BaseModel):
    opdate: datetime
    category: Category = None
    account: Account = None
    credit: Decimal
    recipient: Account = None
    debit: Decimal
    currency: str = None
    party: str = None
    details: str = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(TransactionBase):
    id: int

class TransactionImport(TransactionBase):
    id: int = None
    type: int

class Transaction(TransactionBase):
    id: int
    type: int
    account_balance: Decimal = None
    recipient_balance: Decimal = None
    bg: str

    class Config:
        orm_mode = True
