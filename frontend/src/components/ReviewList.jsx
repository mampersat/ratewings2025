import { useEffect, useState } from "react";

export default function ReviewList({ refresh }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/reviews/")
      .then((res) => res.json())
      .then(setReviews);
  }, [refresh]);

  return (
    <div>
      <h2>Reviews</h2>
      <ul>
        {reviews.map((rev) => (
          <li key={rev.id}>
            <strong>Location ID:</strong> {rev.location_id} — <strong>Rating:</strong> {rev.rating}
            {rev.comment && <> — {rev.comment}</>}
          </li>
        ))}
      </ul>
    </div>
  );
} 