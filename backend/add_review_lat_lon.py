"""Add lat, lon columns to wing_reviews if missing.
Run from backend dir with your venv active (so SQLAlchemy is available):
  cd backend && python add_review_lat_lon.py
  # or: python3 add_review_lat_lon.py
"""
from sqlalchemy import text
from database import engine

def main():
    with engine.connect() as conn:
        r = conn.execute(text("PRAGMA table_info(wing_reviews)"))
        cols = [row[1] for row in r]
        if "lat" not in cols:
            conn.execute(text("ALTER TABLE wing_reviews ADD COLUMN lat REAL"))
            conn.commit()
            print("Added column lat to wing_reviews.")
        if "lon" not in cols:
            conn.execute(text("ALTER TABLE wing_reviews ADD COLUMN lon REAL"))
            conn.commit()
            print("Added column lon to wing_reviews.")
        if "lat" in cols and "lon" in cols:
            print("lat and lon already present.")

if __name__ == "__main__":
    main()
