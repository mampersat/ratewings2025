from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
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
    """Attach average_rating, average_heat and review_count to each location."""
    if not locations:
        return
    stats = db.query(
        models.WingReview.location_id,
        func.avg(models.WingReview.rating).label("avg_rating"),
        func.avg(models.WingReview.heat).label("avg_heat"),
        func.count(models.WingReview.id).label("review_count"),
    ).group_by(models.WingReview.location_id).all()
    stats_dict = {
        loc_id: (float(avg_r) if avg_r is not None else None, float(avg_h) if avg_h is not None else None, int(cnt))
        for loc_id, avg_r, avg_h, cnt in stats
    }
    for loc in locations:
        avg_rating, avg_heat, review_count = stats_dict.get(loc.id, (None, None, 0))
        loc.average_rating = avg_rating
        loc.average_heat = avg_heat
        loc.review_count = review_count


def _attach_last_review_at(locations, db: Session):
    """Attach last_review_at (max created_at) to each location for sorting."""
    if not locations:
        return
    rows = db.query(
        models.WingReview.location_id,
        func.max(models.WingReview.created_at).label("last_review_at"),
    ).group_by(models.WingReview.location_id).all()
    last_at = {loc_id: last for loc_id, last in rows}
    for loc in locations:
        loc.last_review_at = last_at.get(loc.id)


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
    limit: int = 100,
    search: str = Query(None, description="Search by location name or address"),
    ids: str = Query(None, description="Comma-separated location IDs to fetch (e.g. ids=1,2,3)"),
    lat: float = Query(None, description="Latitude for distance search"),
    lon: float = Query(None, description="Longitude for distance search"),
    max_distance: float = Query(20, description="Max distance in miles when lat/lon provided"),
    min_rating: float = Query(None, description="Minimum average rating (0-10)"),
    sort_by: str = Query(None, description="Sort: rating, name, reviews, heat, date_created, recently_reviewed"),
    db: Session = Depends(get_db)
):
    query = db.query(models.WingLocation)

    if ids:
        id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
        if id_list:
            query = query.filter(models.WingLocation.id.in_(id_list))

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.WingLocation.name.ilike(term),
                models.WingLocation.address.ilike(term),
            )
        )

    if min_rating is not None and min_rating > 0:
        subq = (
            db.query(models.WingReview.location_id)
            .group_by(models.WingReview.location_id)
            .having(func.avg(models.WingReview.rating) >= min_rating)
            .subquery()
        )
        query = query.filter(models.WingLocation.id.in_(subq))

    if lat is not None and lon is not None:
        distance_expr = 3958.8 * func.acos(
            func.cos(func.radians(lat)) *
            func.cos(func.radians(models.WingLocation.lat)) *
            func.cos(func.radians(models.WingLocation.lon) - func.radians(lon)) +
            func.sin(func.radians(lat)) *
            func.sin(func.radians(models.WingLocation.lat))
        )
        query = query.add_columns(distance_expr.label("distance"))
        # Fetch enough candidates to filter by max_distance then sort (no limit yet)
        results = query.order_by("distance").limit(500).all()
        locations = []
        for loc, dist in results:
            d = float(dist) if dist is not None else None
            if d is None:
                continue  # skip locations with no coordinates
            if max_distance is not None and d > max_distance:
                continue
            loc.distance = d
            locations.append(loc)
        _attach_rating_stats(locations, db)
        if sort_by == "recently_reviewed":
            _attach_last_review_at(locations, db)
            locations.sort(
                key=lambda loc: (
                    loc.last_review_at is None,
                    -(loc.last_review_at.timestamp() if loc.last_review_at else 0),
                    (loc.name or "").lower(),
                )
            )
        elif sort_by == "rating":
            locations.sort(key=lambda loc: (-(loc.average_rating or 0), loc.name or ""))
        elif sort_by == "heat":
            locations.sort(key=lambda loc: (-(loc.average_heat or 0), loc.name or ""))
        elif sort_by == "reviews":
            locations.sort(key=lambda loc: (-(loc.review_count or 0), loc.name or ""))
        elif sort_by == "date_created":
            locations.sort(key=lambda loc: (-loc.id, loc.name or ""))
        else:
            locations.sort(key=lambda loc: (loc.name or "").lower())
        return locations[skip : skip + limit]

    if sort_by == "recently_reviewed":
        last_review_subq = (
            db.query(
                models.WingReview.location_id,
                func.max(models.WingReview.created_at).label("last_review_at"),
            )
            .group_by(models.WingReview.location_id)
            .subquery()
        )
        query = query.outerjoin(last_review_subq, models.WingLocation.id == last_review_subq.c.location_id)
        query = query.order_by(last_review_subq.c.last_review_at.desc().nullslast(), models.WingLocation.name)
    elif sort_by == "date_created":
        query = query.order_by(models.WingLocation.id.desc())
    elif sort_by == "rating":
        stats = (
            db.query(
                models.WingReview.location_id,
                func.avg(models.WingReview.rating).label("avg_rating"),
                func.avg(models.WingReview.heat).label("avg_heat"),
                func.count(models.WingReview.id).label("review_count"),
            )
            .group_by(models.WingReview.location_id)
            .subquery()
        )
        query = query.outerjoin(stats, models.WingLocation.id == stats.c.location_id)
        query = query.order_by(stats.c.avg_rating.desc().nullslast(), models.WingLocation.name)
    elif sort_by == "heat":
        stats = (
            db.query(
                models.WingReview.location_id,
                func.avg(models.WingReview.rating).label("avg_rating"),
                func.avg(models.WingReview.heat).label("avg_heat"),
                func.count(models.WingReview.id).label("review_count"),
            )
            .group_by(models.WingReview.location_id)
            .subquery()
        )
        query = query.outerjoin(stats, models.WingLocation.id == stats.c.location_id)
        query = query.order_by(stats.c.avg_heat.desc().nullslast(), models.WingLocation.name)
    elif sort_by == "reviews":
        stats = (
            db.query(
                models.WingReview.location_id,
                func.avg(models.WingReview.rating).label("avg_rating"),
                func.avg(models.WingReview.heat).label("avg_heat"),
                func.count(models.WingReview.id).label("review_count"),
            )
            .group_by(models.WingReview.location_id)
            .subquery()
        )
        query = query.outerjoin(stats, models.WingLocation.id == stats.c.location_id)
        query = query.order_by(stats.c.review_count.desc().nullslast(), models.WingLocation.name)
    else:
        # default (e.g. name or unrecognized): by name
        query = query.order_by(models.WingLocation.name)

    locations = query.offset(skip).limit(limit).all()
    _attach_rating_stats(locations, db)
    return locations


def _normalize_name(name: str) -> str:
    """Normalize for duplicate detection: lowercase, strip, collapse spaces."""
    if not name:
        return ""
    return " ".join(name.lower().strip().split())


@router.get("/duplicates", response_model=list[schemas.LocationDuplicateGroup])
def read_duplicate_groups(db: Session = Depends(get_db)):
    """Find locations that share the same normalized name (potential duplicates)."""
    locations = db.query(models.WingLocation).all()
    _attach_rating_stats(locations, db)
    by_key = {}
    for loc in locations:
        key = _normalize_name(loc.name)
        if not key:
            continue
        entry = schemas.LocationDuplicateEntry(
            id=loc.id,
            name=loc.name,
            address=loc.address,
            review_count=getattr(loc, "review_count", 0) or 0,
        )
        by_key.setdefault(key, []).append(entry)
    return [
        schemas.LocationDuplicateGroup(normalized_name=key, locations=group)
        for key, group in sorted(by_key.items())
        if len(group) > 1
    ]


@router.post("/merge", response_model=schemas.LocationMergeResponse)
def merge_locations(body: schemas.LocationMergeRequest, db: Session = Depends(get_db)):
    """Move all reviews from one location into another, then delete the source location."""
    if body.from_id == body.into_id:
        raise HTTPException(status_code=400, detail="from_id and into_id must be different")
    source = db.query(models.WingLocation).filter(models.WingLocation.id == body.from_id).first()
    target = db.query(models.WingLocation).filter(models.WingLocation.id == body.into_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source location not found")
    if not target:
        raise HTTPException(status_code=404, detail="Target location not found")
    count = db.query(models.WingReview).filter(models.WingReview.location_id == body.from_id).update(
        {"location_id": body.into_id},
        synchronize_session=False,
    )
    db.delete(source)
    db.commit()
    return schemas.LocationMergeResponse(reviews_moved=count, location_deleted=body.from_id)


@router.post("/", response_model=schemas.WingLocation)
def create_location(location: schemas.WingLocationCreate, db: Session = Depends(get_db)):
    db_location = models.WingLocation(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location 