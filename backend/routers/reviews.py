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
def read_reviews(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.WingReview).offset(skip).limit(limit).all()

@router.get("/by-id/{review_id}", response_model=schemas.WingReviewWithLocation)
def read_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(models.WingReview).filter(models.WingReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    location = db.query(models.WingLocation).filter(models.WingLocation.id == review.location_id).first()
    return {
        "id": review.id,
        "location_id": review.location_id,
        "rating": review.rating,
        "comment": review.comment,
        "location_name": location.name if location else None,
        "location_address": location.address if location else None,
    }

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