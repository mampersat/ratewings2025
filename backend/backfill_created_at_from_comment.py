#!/usr/bin/env python3
"""Backfill wing_reviews.created_at from comment when it contains 'creator: YYYY-MM-DD'
   (or 'created:' / 'creater:' - typo). Run from backend dir:
   python3 backfill_created_at_from_comment.py
   Or in Docker: docker compose exec backend python3 backfill_created_at_from_comment.py
"""
import re
from datetime import datetime

from sqlalchemy import text

from database import engine

# Match "creator: 2024-01-15" or "created: 2024-01-15" or "creater: 2024-01-15" (case insensitive)
# Optional time part: "creator: 2024-01-15 14:30" or "creator: 2024-01-15 14:30:00"
PATTERN = re.compile(
    r"(?i)(?:creator|created|creater)\s*:\s*"
    r"(\d{4}-\d{2}-\d{2})"
    r"(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?"
)


def parse_date_from_comment(comment: str | None) -> datetime | None:
    if not comment:
        return None
    m = PATTERN.search(comment)
    if not m:
        return None
    date_str = m.group(1)
    time_str = m.group(2) if m.lastindex >= 2 else None
    try:
        if time_str:
            # 14:30 or 14:30:00
            if time_str.count(":") == 1:
                time_str += ":00"
            return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None


def main():
    with engine.connect() as conn:
        r = conn.execute(text("PRAGMA table_info(wing_reviews)"))
        columns = [row[1] for row in r]
        if "created_at" not in columns:
            print("Column created_at does not exist. Run add_created_at.py first.")
            return

        rows = conn.execute(
            text("SELECT id, comment, created_at FROM wing_reviews")
        ).fetchall()

    to_update = []
    for row in rows:
        id_, comment, created_at = row
        if created_at is not None:
            continue
        parsed = parse_date_from_comment(comment)
        if parsed is not None:
            to_update.append((id_, parsed))

    with engine.connect() as conn:
        for id_, parsed in to_update:
            conn.execute(
                text("UPDATE wing_reviews SET created_at = :dt WHERE id = :id"),
                {"dt": parsed.isoformat(), "id": id_},
            )
            print(f"Updated review id={id_} -> created_at={parsed.isoformat()}")
        conn.commit()

    print(f"Done. Updated {len(to_update)} row(s).")


if __name__ == "__main__":
    main()
