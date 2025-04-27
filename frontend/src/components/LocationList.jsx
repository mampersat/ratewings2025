import { useEffect, useState } from "react";

export default function LocationList({ refresh }) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/locations/")
      .then((res) => res.json())
      .then(setLocations);
  }, [refresh]);

  return (
    <div>
      <h2>Wing Locations</h2>
      <ul>
        {locations.map((loc) => (
          <li key={loc.id}>
            <strong>{loc.name}</strong>
            {loc.address && <> — {loc.address}</>}
          </li>
        ))}
      </ul>
    </div>
  );
} 