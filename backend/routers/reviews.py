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

@router.get("/", response_model=list[schemas.WingReviewWithLocation])
def read_reviews(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    reviews = db.query(models.WingReview).offset(skip).limit(limit).all()
    if not reviews:
        return []
    loc_ids = {r.location_id for r in reviews}
    locations = db.query(models.WingLocation).filter(models.WingLocation.id.in_(loc_ids)).all()
    loc_map = {loc.id: {"name": loc.name, "address": loc.address} for loc in locations}
    return [
        {
            "id": r.id,
            "location_id": r.location_id,
            "rating": r.rating,
            "comment": r.comment,
            "location_name": loc_map.get(r.location_id, {}).get("name"),
            "location_address": loc_map.get(r.location_id, {}).get("address"),
        }
        for r in reviews
    ]

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

@router.patch("/by-id/{review_id}", response_model=schemas.WingReview)
def update_review(review_id: int, update: schemas.WingReviewUpdate, db: Session = Depends(get_db)):
    review = db.query(models.WingReview).filter(models.WingReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    data = update.dict(exclude_unset=True)
    if "location_id" in data:
        location = db.query(models.WingLocation).filter(models.WingLocation.id == data["location_id"]).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
    for key, value in data.items():
        setattr(review, key, value)
    db.commit()
    db.refresh(review)
    return review


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