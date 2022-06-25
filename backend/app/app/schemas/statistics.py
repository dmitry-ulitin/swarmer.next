from decimal import Decimal
from pydantic import BaseModel


class Summary(BaseModel):
    currency: str
    debit: Decimal
    credit: Decimal
    transfers_debit: Decimal
    transfers_credit: Decimal
