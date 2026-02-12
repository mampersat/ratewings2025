import { useState, useEffect } from "react";

const RATING_OPTIONS = [1, 2, 4, 5, 6, 7, 8, 9, 10]; // 1–10, skip 3

export default function AddReviewForm({ onAdd, refresh }) {
  const [locationId, setLocationId] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [heat, setHeat] = useState("");
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/locations/")
      .then((res) => res.json())
      .then(setLocations);
  }, [refresh]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8000/reviews/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location_id: Number(locationId),
        rating: Number(rating),
        comment,
        heat: heat === "" ? undefined : Number(heat),
      }),
    });
    if (res.ok) {
      setLocationId("");
      setRating("");
      setComment("");
      setHeat("");
      if (onAdd) onAdd();
    } else {
      alert("Failed to add review");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Review</h3>
      <select
        value={locationId}
        required
        onChange={(e) => setLocationId(e.target.value)}
      >
        <option value="">Select Location</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
      <select
        value={rating}
        required
        onChange={(e) => setRating(e.target.value)}
      >
        <option value="">Rating…</option>
        {RATING_OPTIONS.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <select
        value={heat}
        onChange={(e) => setHeat(e.target.value)}
      >
        <option value="">Heat (optional)</option>
        {RATING_OPTIONS.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <input
        placeholder="Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
} 