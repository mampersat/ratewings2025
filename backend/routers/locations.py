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
        # Attach distance to each location object
        locations_with_distance = []
        for loc, dist in results:
            loc.distance = float(dist) if dist is not None else None
            locations_with_distance.append(loc)
        return locations_with_distance
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.WingLocation)
def create_location(location: schemas.WingLocationCreate, db: Session = Depends(get_db)):
    db_location = models.WingLocation(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location 