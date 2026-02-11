from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base

class WingLocation(Base):
    __tablename__ = "wing_locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    reviews = relationship("WingReview", back_populates="location")

class WingReview(Base):
    __tablename__ = "wing_reviews"
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("wing_locations.id"))
    rating = Column(Float)
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    location = relationship("WingLocation", back_populates="reviews") 