#!/usr/bin/env python3
"""Add heat column to wing_reviews if missing, then backfill from comment text.
   Looks for 'heat: N' (e.g. heat: 5) in comment and sets heat to that integer.
   Run from backend dir:
   python3 add_heat_and_backfill.py
   Or in Docker: docker compose exec backend python3 add_heat_and_backfill.py
"""
import re

from sqlalchemy import text

from database import engine

# Match "heat: 5" or "heat: 10" (case insensitive, optional spaces)
HEAT_PATTERN = re.compile(r"(?i)heat\s*:\s*(\d+)")


def parse_heat_from_comment(comment: str | None) -> int | None:
    if not comment:
        return None
    m = HEAT_PATTERN.search(comment)
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


def main():
    with engine.connect() as conn:
        r = conn.execute(text("PRAGMA table_info(wing_reviews)"))
        columns = [row[1] for row in r]

    if "heat" not in columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE wing_reviews ADD COLUMN heat INTEGER"))
            conn.commit()
        print("Added column heat to wing_reviews.")

    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, comment, heat FROM wing_reviews")
        ).fetchall()

    to_update = []
    for row in rows:
        id_, comment, existing_heat = row
        if existing_heat is not None:
            continue
        parsed = parse_heat_from_comment(comment)
        if parsed is not None:
            to_update.append((id_, parsed))

    with engine.connect() as conn:
        for id_, heat_val in to_update:
            conn.execute(
                text("UPDATE wing_reviews SET heat = :heat WHERE id = :id"),
                {"heat": heat_val, "id": id_},
            )
            print(f"Updated review id={id_} -> heat={heat_val}")
        conn.commit()

    print(f"Done. Backfilled heat for {len(to_update)} row(s).")


if __name__ == "__main__":
    main()
