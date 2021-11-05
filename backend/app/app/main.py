from typing import List
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from . import crud
from .database import SessionLocal, engine, Base
from .schemas.account import AccountGroup
from .schemas.transaction import Transaction

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/groups/", response_model=List[AccountGroup], dependencies=[Depends(get_db)])
def read_groups(db: Session = Depends(get_db)):
    user_id = 2
    groups = crud.get_groups(db, user_id)
    return groups

@app.get("/api/transactions/", response_model=List[Transaction], dependencies=[Depends(get_db)])
def read_transactions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    user_id = 2
    transactions = crud.get_transactions(db, user_id, skip, limit)
    return transactions

