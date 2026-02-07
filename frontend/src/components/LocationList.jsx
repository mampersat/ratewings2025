import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8000";

export default function LocationList({ refresh }) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/locations/?limit=500`)
      .then((res) => res.json())
      .then(setLocations);
  }, [refresh]);

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
                  ? `${Number(loc.average_rating).toFixed(1)}/10`
                  : "—"}
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
