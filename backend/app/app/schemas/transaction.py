from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

from .category import Category
from .account import Account

class TransactionBase(BaseModel):
    opdate: datetime
    category: Category = None
    account: Account = None
    account_balance: Decimal = None
    credit: Decimal
    recipient: Account = None
    recipient_balance: Decimal = None
    debit: Decimal
    currency: str = None
    details: str = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int
    type: int
    bg: str

    class Config:
        orm_mode = True
