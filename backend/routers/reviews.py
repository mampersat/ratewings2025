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

@router.get("/", response_model=list[schemas.WingReview])
def read_reviews(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.WingReview).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.WingReview)
def create_review(review: schemas.WingReviewCreate, db: Session = Depends(get_db)):
    # Ensure location exists
    location = db.query(models.WingLocation).filter(models.WingLocation.id == review.location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    db_review = models.WingReview(**review.dict())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review 