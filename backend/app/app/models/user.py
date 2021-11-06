from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.event import listens_for
from app.database import Base, SessionLocal

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    name = Column(String, nullable=False)
    currency = Column(String, default='RUB')
    created = Column(DateTime, default=datetime.now)
    updated = Column(DateTime, default=datetime.now)

@listens_for(User.__table__, 'after_create')
def insert_initial_records(*args, **kwargs):
    db = SessionLocal()
    db.add(User(id=1, email='test@gmail.com', name='Test', hashed_password='21a153c6c63e764cf52339f5ade532f9'))
    db.add(User(id=2, email='test2@gmail.com', name='Test2', hashed_password='21a153c6c63e764cf52339f5ade532f9'))
    db.commit()