import { useState } from "react";
import { API_BASE } from '../api';

export default function AddLocationForm({ onAdd }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/locations/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address }),
    });
    if (res.ok) {
      setName("");
      setAddress("");
      if (onAdd) onAdd();
    } else {
      alert("Failed to add location");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Location</h3>
      <input
        placeholder="Name"
        value={name}
        required
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
} 