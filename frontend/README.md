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

- **/** — Search (by city or “Find Near Me”)
- **/locations** — Add and list wing locations
- **/reviews** — Add and list reviews (table)

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

One location has many reviews; each review belongs to one location.
