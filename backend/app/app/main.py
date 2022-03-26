from typing import List
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from .crud import crud
from . import schemas
from .database import SessionLocal, engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/login/")
def read_root():
    return {"access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2MzYxMjQ3NjcsIm5iZiI6MTYzNjEyNDc2NywianRpIjoiMmQxMjg5ZGMtNzg5OC00MWYwLWE4MjAtYTRkMjUyZmRiMDk3IiwiaWRlbnRpdHkiOnsiZW1haWwiOiJkbWl0cnkudWxpdGluQGdtYWlsLmNvbSIsIm5hbWUiOiJEbWl0cnkiLCJpZCI6MSwiY3VycmVuY3kiOiJSVUIifSwiZnJlc2giOmZhbHNlLCJ0eXBlIjoiYWNjZXNzIn0.6TY__4KWu-Uwp8xInzMm65-WAbM0gK_CdYnO4PdiypM"}

@app.get("/api/groups/", response_model=List[schemas.AccountGroup], dependencies=[Depends(get_db)])
def read_groups(db: Session = Depends(get_db)):
    user_id = 2
    groups = crud.get_groups(db, user_id)
    return groups

@app.get("/api/transactions/", response_model=List[schemas.Transaction], dependencies=[Depends(get_db)])
def read_transactions(skip: int = 0, limit: int = 50, accounts: str = '', db: Session = Depends(get_db)):
    user_id = 2
    transactions = crud.get_transactions(db, user_id, skip, limit, [int(a) for a in accounts.split(',') if a])
    return transactions

@app.get("/api/transactions/{id}", response_model=schemas.Transaction, dependencies=[Depends(get_db)])
def read_transaction(id: int, db: Session = Depends(get_db)):
    user_id = 2
    return crud.get_transaction(db, user_id, id)

@app.post("/api/transactions/", response_model=schemas.Transaction)
def create_item_for_user(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    user_id = 2
    return crud.add_transaction(db=db, user_id=user_id, transaction=transaction)

@app.get("/api/categories/", response_model=List[schemas.Category], dependencies=[Depends(get_db)])
def read_categories(db: Session = Depends(get_db)):
    user_id = 2
    categories = crud.get_user_categories(db, user_id)
    return categories
