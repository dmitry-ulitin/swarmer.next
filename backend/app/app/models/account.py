from datetime import datetime
from fastapi.params import Depends
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.event import listens_for
from app.database import Base, SessionLocal
from sqlalchemy.util.langhelpers import hybridproperty

db = SessionLocal()

class AccountGroup(Base):
    __tablename__ = "account_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    order = Column(Integer, default = 0, nullable=False)
    created = Column(DateTime, default=datetime.now, nullable=False)
    updated = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    deleted = Column(Boolean, default=False, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User")
    accounts = relationship("Account", back_populates="group")
    permissions = relationship("AccountUser")
    @hybridproperty
    def fullname(self):
        return self.name if self.current_user_id == self.user_id or self.current_user_id in [p.user_id for p in self.permissions if p.admin] else self.name + ' (' + self.user.name + ')'

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
    currency = Column(String, default='RUB', nullable=False)
    start_balance = Column(Numeric(10,2), nullable=False)
    created = Column(DateTime, default=datetime.now, nullable=False)
    updated = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    deleted = Column(Boolean, default=False, nullable=False)
    group_id = Column(Integer, ForeignKey("account_groups.id"))
    group = relationship("AccountGroup", back_populates="accounts")

@listens_for(Account.__table__, 'after_create')
def insert_initial_records(*args, **kwargs):
    print("create test accounts...")
    db.add(Account(id=1, group_id=1, currency='RUB', start_balance=5450))
    db.add(Account(id=2, group_id=2, currency='RUB', start_balance=56432.28))
    db.add(Account(id=3, group_id=2, currency='USD', start_balance=456))
    db.commit()

class AccountUser(Base):
    __tablename__ = 'account_users'
    group_id = Column(Integer, ForeignKey('account_groups.id'), primary_key=True)
    group = relationship("AccountGroup", back_populates="permissions")
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    user = relationship("User")
    created = Column(DateTime, default=datetime.now, nullable=False)
    updated = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    deleted = Column(Boolean, default = False, nullable=False)
    write = Column(Boolean, default = False, nullable=False)
    admin = Column(Boolean, default = False, nullable=False)
    name = Column(String)
    order = Column(Integer, default = 0)
    def __repr__(self):
        return '<AccountUser %r-%r, write: %s>' % (self.group.name, self.user.name, self.write)

# for test purposes
@listens_for(AccountUser.__table__, 'after_create')
def insert_initial_records(*args, **kwargs):
    print("create test permissions...")
    db.add(AccountUser(group_id=1, user_id=2))
    db.add(AccountUser(group_id=2, user_id=2))
    db.commit()
