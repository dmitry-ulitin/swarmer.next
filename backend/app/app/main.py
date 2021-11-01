from typing import List
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from . import crud
from .database import SessionLocal, engine, Base
from .schemas.account import AccountGroup

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/groups/", response_model=List[AccountGroup], dependencies=[Depends(get_db)])
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    groups = crud.get_groups(db, skip=skip, limit=limit)
    for group in groups:
        group.current_user_id = 2
    return groups

