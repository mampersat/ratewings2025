from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.WingLocation])
def read_locations(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.WingLocation).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.WingLocation)
def create_location(location: schemas.WingLocationCreate, db: Session = Depends(get_db)):
    db_location = models.WingLocation(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location 