from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class WingLocationBase(BaseModel):
    name: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class WingLocationCreate(WingLocationBase):
    pass

class WingLocation(WingLocationBase):
    id: int
    distance: Optional[float] = None
    average_rating: Optional[float] = None
    average_heat: Optional[float] = None
    review_count: Optional[int] = None
    class Config:
        orm_mode = True


class LocationMergeRequest(BaseModel):
    from_id: int
    into_id: int


class LocationMergeResponse(BaseModel):
    reviews_moved: int
    location_deleted: int


class LocationDuplicateEntry(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    review_count: int


class LocationDuplicateGroup(BaseModel):
    normalized_name: str
    locations: list[LocationDuplicateEntry]

class WingReviewBase(BaseModel):
    rating: float
    comment: Optional[str] = None
    heat: Optional[int] = None  # 0-10

class WingReviewCreate(WingReviewBase):
    location_id: int


class WingReviewUpdate(BaseModel):
    location_id: Optional[int] = None
    rating: Optional[float] = None
    comment: Optional[str] = None
    heat: Optional[int] = None


class WingReview(WingReviewBase):
    id: int
    location_id: int
    created_at: Optional[datetime] = None
    class Config:
        orm_mode = True

class WingReviewWithLocation(WingReview):
    location_name: Optional[str] = None
    location_address: Optional[str] = None 