from sqlalchemy.orm import Session
from .models.account import AccountGroup

def get_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AccountGroup).offset(skip).limit(limit).all()
