from datetime import datetime
from sqlalchemy import Column, Integer, Boolean, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Rule(Base):
    __tablename__ = 'rules'
    PARTY_EQUALS = 1
    PARTY_CONTAINS = 2
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created = Column(DateTime, nullable = False, default=datetime.now)
    updated = Column(DateTime, nullable = False, default=datetime.now, onupdate=datetime.now)
    transaction_type = Column(Integer, nullable=False)
    condition_type = Column(Integer, nullable=False)
    condition_value = Column(String(250), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    category = relationship("Category")
    party_id = Column(Integer, ForeignKey('accounts.id'), nullable=True)
