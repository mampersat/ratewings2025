# Chicken Wing Rating App — Frontend

React + Vite frontend for the Chicken Wing Rating API. Search locations, add locations and reviews, and browse in a table.

## Run locally

```bash
npm install
npm run dev
```

Ensure the backend is running on `http://localhost:8000` (see repo root / backend).

## Scripts

- **`npm run dev`** — Start Vite dev server
- **`npm run build`** — Production build
- **`npm run preview`** — Preview production build
- **`npm run lint`** — Run ESLint

## Pages

- **/** — Search (by name/address or “Find Near Me”, sort by rating/name/reviews/near me)
- **/locations/:id** — Location detail and its reviews
- **/new-rating** — Add a rating (existing or new location)
- **/duplicates** — Merge duplicate or selected locations (admin only)
- **/reviews** — List reviews and add new ones

---

## Database schema

Backend uses SQLite (`backend/wings.db`) with two tables.

### `wing_locations`

| Column    | Type    | Notes        |
|-----------|---------|--------------|
| `id`      | Integer | Primary key  |
| `name`    | String  | Indexed      |
| `address` | String  |              |
| `lat`     | Float   | Latitude     |
| `lon`     | Float   | Longitude    |

### `wing_reviews`

| Column       | Type    | Notes                    |
|--------------|---------|--------------------------|
| `id`         | Integer | Primary key              |
| `location_id`| Integer | FK → `wing_locations.id`  |
| `rating`     | Float   |                          |
| `comment`    | String  |                          |
| `heat`       | Integer | Optional, 0–10            |
| `created_at` | DateTime| Optional, nullable       |

One location has many reviews; each review belongs to one location.
