import { useState, useEffect } from "react";

export default function AddReviewForm({ onAdd, refresh }) {
  const [locationId, setLocationId] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
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
      }),
    });
    if (res.ok) {
      setLocationId("");
      setRating("");
      setComment("");
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
      <input
        type="number"
        placeholder="Rating (0-10)"
        value={rating}
        min={0}
        max={10}
        step={0.1}
        required
        onChange={(e) => setRating(e.target.value)}
      />
      <input
        placeholder="Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
} 