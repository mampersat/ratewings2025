from fastapi import FastAPI
from routers import locations, reviews
import models
from database import engine
from fastapi.middleware.cors import CORSMiddleware

# Create database tables
models.Base.metadata.create_all(bind=engine)

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