from datetime import datetime
from fastapi.params import Depends
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.event import listens_for
from app.database import Base

class AccountGroup(Base):
    __tablename__ = "account_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created = Column(DateTime, default=datetime.now)
    updated = Column(DateTime, default=datetime.now)
    deleted = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    accounts = relationship("Account", back_populates="group")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    currency = Column(String, default='RUB')
    start_balance = Column(Numeric(10,2), nullable=False)
    created = Column(DateTime, default=datetime.now)
    updated = Column(DateTime, default=datetime.now)
    deleted = Column(Boolean, default=False)
    group_id = Column(Integer, ForeignKey("account_groups.id"))
    group = relationship("AccountGroup", back_populates="accounts")
