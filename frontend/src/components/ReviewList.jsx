import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem 0.75rem' }}>Review</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Location ID</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Rating</th>
            <th style={{ padding: '0.5rem 0.75rem' }}>Comment</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((rev) => (
            <tr key={rev.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem 0.75rem' }}>
                <Link to={`/reviews/${rev.id}`} style={{ color: '#646cff' }}>#{rev.id}</Link>
              </td>
              <td style={{ padding: '0.5rem 0.75rem' }}>{rev.location_id}</td>
              <td style={{ padding: '0.5rem 0.75rem' }}>{rev.rating}</td>
              <td style={{ padding: '0.5rem 0.75rem' }}>{rev.comment ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 