from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class WingLocation(Base):
    __tablename__ = "wing_locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    address = Column(String)
    reviews = relationship("WingReview", back_populates="location")

class WingReview(Base):
    __tablename__ = "wing_reviews"
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("wing_locations.id"))
    rating = Column(Float)
    comment = Column(String)
    location = relationship("WingLocation", back_populates="reviews") 