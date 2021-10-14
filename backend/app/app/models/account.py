from datetime import datetime
from fastapi.params import Depends
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.event import listens_for
from app.database import Base, SessionLocal

db = SessionLocal()

class AccountGroup(Base):
    __tablename__ = "account_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created = Column(DateTime, default=datetime.now)
    updated = Column(DateTime, default=datetime.now)
    deleted = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User")
    accounts = relationship("Account", back_populates="group")

@listens_for(AccountGroup.__table__, 'after_create')
def insert_initial_records(*args, **kwargs):
    print("create test account groups...")
    db.add(AccountGroup(id=1, name='cash', user_id=1))
    db.add(AccountGroup(id=2, name='visa ...1234', user_id=1))
    db.commit()

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    currency = Column(String, default='RUB')
    start_balance = Column(Numeric(10,2), nullable=False)
    created = Column(DateTime, default=datetime.now)
    updated = Column(DateTime, default=datetime.now)
    deleted = Column(Boolean, default=False)
    group_id = Column(Integer, ForeignKey("account_groups.id"))
    group = relationship("AccountGroup", back_populates="accounts")

@listens_for(Account.__table__, 'after_create')
def insert_initial_records(*args, **kwargs):
    print("create test accounts...")
    db.add(Account(id=1, group_id=1, currency='RUB', start_balance=5450))
    db.add(Account(id=2, group_id=2, currency='RUB', start_balance=56432.28))
    db.add(Account(id=3, group_id=2, currency='USD', start_balance=456))
    db.commit()
