#!/usr/bin/env python3
"""One-off: add created_at to wing_reviews if missing. Run from backend dir:
   python add_created_at.py
   Or in Docker: docker compose exec backend python add_created_at.py
"""
from database import engine
from sqlalchemy import text

def main():
    with engine.connect() as conn:
        # Check if column exists (SQLite)
        r = conn.execute(text("PRAGMA table_info(wing_reviews)"))
        columns = [row[1] for row in r]
        if "created_at" in columns:
            print("Column created_at already exists. Nothing to do.")
            return
        conn.execute(text("ALTER TABLE wing_reviews ADD COLUMN created_at DATETIME"))
        conn.commit()
        print("Added column created_at to wing_reviews.")

if __name__ == "__main__":
    main()
