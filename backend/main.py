from fastapi import FastAPI
from sqlalchemy import text
from routers import locations, reviews
import models
from database import engine
from fastapi.middleware.cors import CORSMiddleware

# Create database tables
models.Base.metadata.create_all(bind=engine)


def _ensure_review_lat_lon():
    """Add lat, lon to wing_reviews if missing (e.g. after deploy or old DB)."""
    with engine.connect() as conn:
        r = conn.execute(text("PRAGMA table_info(wing_reviews)"))
        cols = [row[1] for row in r]
        if "lat" not in cols:
            conn.execute(text("ALTER TABLE wing_reviews ADD COLUMN lat REAL"))
            conn.commit()
        if "lon" not in cols:
            conn.execute(text("ALTER TABLE wing_reviews ADD COLUMN lon REAL"))
            conn.commit()


_ensure_review_lat_lon()

app = FastAPI(
    title="Chicken Wing Rating API",
    description="API for rating and reviewing chicken wings and locations.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL(s) instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(locations.router, prefix="/locations", tags=["Locations"])
app.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Chicken Wing Rating API!"}