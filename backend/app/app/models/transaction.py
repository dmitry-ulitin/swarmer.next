from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.event import listens_for
from app.database import Base, SessionLocal
from sqlalchemy.util.langhelpers import hybridproperty

from .category import Category

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created = Column(DateTime, nullable = False, default=datetime.now)
    updated = Column(DateTime, nullable = False, default=datetime.now, onupdate=datetime.now)
    opdate = Column(DateTime, nullable = False)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True)
    account = relationship("Account", foreign_keys=[account_id])
    credit = Column(Numeric, nullable=False)
    recipient_id = Column(Integer, ForeignKey('accounts.id'), nullable=True)
    recipient = relationship("Account", foreign_keys=[recipient_id])
    debit = Column(Numeric, nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    category = relationship("Category")
    currency = Column(String, nullable=True)
    details = Column(String, nullable=True)
    mcc = Column(Integer, nullable=True)
    @hybridproperty
    def type(self):
        return Category.TRANSFER if self.account_id and self.recipient_id else Category.EXPENSE if self.account_id else Category.INCOME
    @hybridproperty
    def bg(self):
        return Category.TRANSFER_BG if self.type == 0 else self.category.bgc if self.category else Category.EXPENSE_BG if self.type == Category.EXPENSE else Category.INCOME_BG


@listens_for(Transaction.__table__, 'after_create')
def insert_initial_records(*args, **kwargs):
    try:
        db = SessionLocal()
        db.add(Transaction(id=1, owner_id=1, opdate=datetime.now(), account_id=2, credit=4900, recipient_id=1, debit=4900))
        db.add(Transaction(id=2, owner_id=1, opdate=datetime.now(), account_id=1, credit=260, debit=260, category_id=1022, currency='RUB', details='lunch'))
        db.add(Transaction(id=3, owner_id=1, opdate=datetime.now(), account_id=2, credit=465, debit=260, category_id=108, currency='RUB', details='telephony'))
        db.commit()
    finally:
        db.close()
