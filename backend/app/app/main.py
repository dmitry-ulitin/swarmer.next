from typing import List
from fastapi import FastAPI, Depends, Form, Response, UploadFile
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

@app.post("/api/login")
def read_root():
    return {"access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJuYXRhLnVsaXRpbmFAZ21haWwuY29tIiwibmFtZSI6Ik5hdGEiLCJjdXJyZW5jeSI6IkVVUiIsImlkIjoyLCJpYXQiOjE2NjA4NzQ1NTF9.EcjeanYh0twKVCHnXIUWI2wFf39uthvOoWSZb7PWwmA"}

@app.get("/api/groups", response_model=List[schemas.AccountGroup])
def get_groups(db: Session = Depends(get_db)):
    user_id = 2
    return crud.get_groups(db, user_id)

@app.get("/api/groups/{id}", response_model=schemas.AccountGroup)
def get_group(id: int, db: Session = Depends(get_db)):
    user_id = 2
    return crud.get_group(db, user_id, id)

@app.post("/api/groups", response_model=schemas.AccountGroup)
def create_group(group: schemas.AccountGroupCreate, db: Session = Depends(get_db)):
    user_id = 2
    return crud.create_group(db, user_id, group)

@app.put("/api/groups", response_model=schemas.AccountGroup)
def update_group(group: schemas.AccountGroupUpdate, db: Session = Depends(get_db)):
    user_id = 2
    return crud.update_group(db, user_id, group)

@app.delete("/api/groups/{id}", status_code=204, response_class=Response)
def delete_group(id: int, db: Session = Depends(get_db)):
    user_id = 2
    crud.delete_group(db, user_id, id)

@app.get("/api/transactions", response_model=List[schemas.Transaction])
def get_transactions(skip: int = 0, limit: int = 0, accounts: str = '', search: str = '', db: Session = Depends(get_db)):
    user_id = 2
    transactions = crud.get_transactions(db, user_id, skip, limit, [int(a) for a in accounts.split(',') if a], True, [], search)
    return transactions

@app.get("/api/transactions/summary", response_model=List[schemas.Summary])
def get_summary(accounts: str = '', db: Session = Depends(get_db)):
    user_id = 2
    summary = crud.get_summary(db, user_id, [int(a) for a in accounts.split(',') if a])
    return summary

@app.get("/api/transactions/{id}", response_model=schemas.Transaction)
def get_transaction(id: int, db: Session = Depends(get_db)):
    user_id = 2
    return crud.get_transaction(db, user_id, id)

@app.post("/api/transactions", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    user_id = 2
    return crud.create_transaction(db=db, user_id=user_id, transaction=transaction)

@app.put("/api/transactions", response_model=schemas.Transaction)
def update_transaction(transaction: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    user_id = 2
    return crud.update_transaction(db=db, user_id=user_id, transaction=transaction)

@app.delete("/api/transactions/{id}", status_code=204, response_class=Response)
def delete_transaction(id: int, db: Session = Depends(get_db)):
    user_id = 2
    crud.delete_transaction(db, user_id, id)

@app.post("/api/transactions/import", response_model=List[schemas.TransactionImport])
def import_transactions(file: UploadFile, id: int = Form(...), bank: int = Form(...), db: Session = Depends(get_db)):
    user_id = 2
    return crud.import_transactions(db, user_id, id, bank, file)

@app.patch("/api/transactions/import", status_code=204, response_class=Response)
def create_transactions(transactions: List[schemas.TransactionImport], db: Session = Depends(get_db)):
    user_id = 2
    crud.create_transactions(db=db, user_id=user_id, transactions=transactions)

@app.get("/api/transactions/summary", response_model=List[schemas.Summary])
def get_summary(accounts: str = '', db: Session = Depends(get_db)):
    user_id = 2
    summary = crud.get_summary(db, user_id, [int(a) for a in accounts.split(',') if a])
    return summary

@app.get("/api/categories", response_model=List[schemas.Category])
def read_categories(db: Session = Depends(get_db)):
    user_id = 2
    categories = crud.get_user_categories(db, user_id)
    return categories
