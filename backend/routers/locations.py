from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _attach_rating_stats(locations, db: Session):
    """Attach average_rating and review_count to each location."""
    if not locations:
        return
    stats = db.query(
        models.WingReview.location_id,
        func.avg(models.WingReview.rating).label("avg_rating"),
        func.count(models.WingReview.id).label("review_count"),
    ).group_by(models.WingReview.location_id).all()
    stats_dict = {
        loc_id: (float(avg) if avg is not None else None, int(cnt))
        for loc_id, avg, cnt in stats
    }
    for loc in locations:
        avg_rating, review_count = stats_dict.get(loc.id, (None, 0))
        loc.average_rating = avg_rating
        loc.review_count = review_count


@router.get("/by-id/{location_id}", response_model=schemas.WingLocation)
def read_location(location_id: int, db: Session = Depends(get_db)):
    """Get a single location by ID. Declared before list so path is matched first."""
    location = db.query(models.WingLocation).filter(models.WingLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    _attach_rating_stats([location], db)
    return location


@router.get("/", response_model=list[schemas.WingLocation])
def read_locations(
    skip: int = 0,
    limit: int = 10,
    search: str = Query(None, description="Search by address"),
    lat: float = Query(None, description="Latitude for distance search"),
    lon: float = Query(None, description="Longitude for distance search"),
    db: Session = Depends(get_db)
):
    query = db.query(models.WingLocation)
    if search:
        query = query.filter(models.WingLocation.address.ilike(f"%{search}%"))
    if lat is not None and lon is not None:
        # Haversine formula for distance in miles
        distance_expr = 3958.8 * func.acos(
            func.cos(func.radians(lat)) *
            func.cos(func.radians(models.WingLocation.lat)) *
            func.cos(func.radians(models.WingLocation.lon) - func.radians(lon)) +
            func.sin(func.radians(lat)) *
            func.sin(func.radians(models.WingLocation.lat))
        )
        query = query.add_columns(distance_expr.label("distance"))
        query = query.order_by("distance")
        results = query.offset(skip).limit(limit).all()
        locations = []
        for loc, dist in results:
            loc.distance = float(dist) if dist is not None else None
            locations.append(loc)
        _attach_rating_stats(locations, db)
        return locations
    locations = query.offset(skip).limit(limit).all()
    _attach_rating_stats(locations, db)
    return locations


@router.post("/", response_model=schemas.WingLocation)
def create_location(location: schemas.WingLocationCreate, db: Session = Depends(get_db)):
    db_location = models.WingLocation(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location 