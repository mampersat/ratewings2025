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
    review_count: Optional[int] = None
    class Config:
        orm_mode = True

class WingReviewBase(BaseModel):
    rating: float
    comment: Optional[str] = None

class WingReviewCreate(WingReviewBase):
    location_id: int

class WingReview(WingReviewBase):
    id: int
    location_id: int
    class Config:
        orm_mode = True

class WingReviewWithLocation(WingReview):
    location_name: Optional[str] = None
    location_address: Optional[str] = None 