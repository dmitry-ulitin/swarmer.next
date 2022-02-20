from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.event import listens_for
from app.database import Base, SessionLocal
from sqlalchemy.util.langhelpers import hybridproperty

class Category(Base):
    __tablename__ = 'categories'
    TRANSFER = 0
    EXPENSE = 1
    INCOME = 2
    EXPENSE_BG = '#ffe2dc'
    INCOME_BG = '#ddffd7'
    TRANSFER_BG = '#f9fbbe'
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created = Column(DateTime, nullable = False, default=datetime.now)
    updated = Column(DateTime, nullable = False, default=datetime.now, onupdate=datetime.now)
    parent_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    parent = relationship("Category", remote_side=[id])
    name = Column(String(250), nullable=False)
    bg = Column(String(16), nullable=True)
    @hybridproperty
    def root(self):
        return self.parent.root if self.parent_id else self
    @hybridproperty
    def root_id(self):
        return self.root.id
    @hybridproperty
    def level(self):
        return self.parent.level + 1 if self.parent_id else 0
    @hybridproperty
    def fullname(self):
        return self.parent.fullname + ' / ' + self.name if self.parent_id and self.parent.parent_id else self.name
    @hybridproperty
    def fullpath(self):
        return self.parent.fullname + ' / ' + self.name if self.parent_id else self.name
    @hybridproperty
    def bgc(self):
        return self.bg if self.bg else self.parent.bgc if self.parent else None
    def __repr__(self):
        return '<Category %r>' % self.name

@listens_for(Category.__table__, 'after_create')
def insert_initial_records(*args, **kwargs):
    try:
        db = SessionLocal()
        db.add(Category(id=Category.EXPENSE, name='Expense', bg=Category.EXPENSE_BG))
        db.add(Category(id=Category.INCOME, name='Income', bg=Category.INCOME_BG))
        db.add(Category(id=101, parent_id=Category.EXPENSE, name='Car', owner_id=1))
        db.add(Category(id=1011, parent_id=101, name='Fuel', owner_id=1))
        db.add(Category(id=1012, parent_id=101, name='Repair', owner_id=1))
        db.add(Category(id=102, parent_id=Category.EXPENSE, name='Food', owner_id=1))
        db.add(Category(id=1021, parent_id=102, name='Food supplies', owner_id=1))
        db.add(Category(id=1022, parent_id=102, name='Restorants', owner_id=1))
        db.add(Category(id=103, parent_id=Category.EXPENSE, name='Household', owner_id=1))
        db.add(Category(id=104, parent_id=Category.EXPENSE, name='Healthcare', owner_id=1))
        db.add(Category(id=1041, parent_id=104, name='Medicine', owner_id=1))
        db.add(Category(id=1042, parent_id=104, name='Doctors', owner_id=1))
        db.add(Category(id=105, parent_id=Category.EXPENSE, name='Transport', owner_id=1))
        db.add(Category(id=106, parent_id=Category.EXPENSE, name='Clothes', owner_id=1))
        db.add(Category(id=107, parent_id=Category.EXPENSE, name='Entertainment', owner_id=1))
        db.add(Category(id=108, parent_id=Category.EXPENSE, name='Bills', owner_id=1))
        db.add(Category(id=1081, parent_id=108, name='Rent', owner_id=1))
        db.add(Category(id=1082, parent_id=108, name='Electricity', owner_id=1))
        db.add(Category(id=1083, parent_id=108, name='Internet', owner_id=1))
        db.add(Category(id=109, parent_id=Category.EXPENSE, name='Presents', owner_id=1))
        db.add(Category(id=110, parent_id=Category.EXPENSE, name='Traveling', owner_id=1))
        db.add(Category(id=111, parent_id=Category.EXPENSE, name='Clothes', owner_id=1))
        db.add(Category(id=112, parent_id=Category.EXPENSE, name='Education', owner_id=1))
        db.add(Category(id=113, parent_id=Category.EXPENSE, name='Gifts', owner_id=1))
        db.add(Category(id=114, parent_id=Category.EXPENSE, name='Interests and hobbies', owner_id=1))
        
        db.add(Category(id=201, parent_id=Category.INCOME, name='Salary', owner_id=1))
        db.add(Category(id=202, parent_id=Category.INCOME, name='Bonuses', owner_id=1))
        db.add(Category(id=203, parent_id=Category.INCOME, name='Cashback', owner_id=1))
        db.add(Category(id=204, parent_id=Category.INCOME, name='Interest', owner_id=1))
        db.commit()
    finally:
        db.close()
