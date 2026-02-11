import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8000";

export default function LocationList({ refresh }) {
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    fetch(`${API_BASE}/locations/?limit=500`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend returned ${res.status}`);
        return res.json();
      })
      .then(setLocations)
      .catch((err) => setError(err.message || "Failed to fetch locations"));
  }, [refresh]);

  if (error) {
    return (
      <div>
        <h2>Wing Locations</h2>
        <p style={{ color: "#c00" }}>{error}</p>
        <p style={{ fontSize: "0.9rem", color: "#666" }}>
          Make sure the backend is running at <code>{API_BASE}</code> (e.g. <code>uvicorn main:app --port 8000</code> or Docker).
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Wing Locations</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "0.5rem 0.75rem" }}>Location</th>
            <th style={{ padding: "0.5rem 0.75rem" }}>Name</th>
            <th style={{ padding: "0.5rem 0.75rem" }}>Address</th>
            <th style={{ padding: "0.5rem 0.75rem" }}>Rating</th>
            <th style={{ padding: "0.5rem 0.75rem" }}>Heat</th>
            <th style={{ padding: "0.5rem 0.75rem" }}>Reviews</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem 0.75rem" }}>
                <Link to={`/locations/${loc.id}`} style={{ color: "#646cff" }}>
                  #{loc.id}
                </Link>
              </td>
              <td style={{ padding: "0.5rem 0.75rem" }}>{loc.name}</td>
              <td style={{ padding: "0.5rem 0.75rem" }}>{loc.address ?? "—"}</td>
              <td style={{ padding: "0.5rem 0.75rem" }}>
                {loc.average_rating != null
                  ? <>{Number(loc.average_rating) % 1 === 0 ? Math.round(Number(loc.average_rating)) : Number(loc.average_rating).toFixed(1)}<span className="rating-out-of">/10</span></>
                  : "—"}
              </td>
              <td style={{ padding: "0.5rem 0.75rem" }}>
                {loc.average_heat != null ? <>{Number(loc.average_heat) % 1 === 0 ? Math.round(Number(loc.average_heat)) : Number(loc.average_heat).toFixed(1)}<span className="rating-out-of">/10</span></> : "—"}
              </td>
              <td style={{ padding: "0.5rem 0.75rem" }}>
                {loc.review_count != null ? loc.review_count : 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
