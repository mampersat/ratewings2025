import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

export default function DuplicatesPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [merging, setMerging] = useState(null) // { fromId, intoId } while request in flight
  const [mergeResult, setMergeResult] = useState(null) // { reviews_moved, location_deleted } after success

  const fetchDuplicates = () => {
    setError(null)
    return fetch(`${API_BASE}/locations/duplicates`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load duplicates')
        return res.json()
      })
      .then(setGroups)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDuplicates()
  }, [])

  const handleMerge = async (fromId, intoId) => {
    if (fromId === intoId) return
    setMergeResult(null)
    setMerging({ fromId, intoId })
    try {
      const res = await fetch(`${API_BASE}/locations/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: fromId, into_id: intoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Merge failed')
      setMergeResult(data)
      await fetchDuplicates()
    } catch (err) {
      alert(err.message || 'Merge failed')
    } finally {
      setMerging(null)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20, textAlign: 'left' }}>
        Loading duplicate groups…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20, textAlign: 'left' }}>
        <p>{error}</p>
        <button type="button" onClick={() => { setLoading(true); fetchDuplicates(); }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <h2 style={{ marginTop: 0 }}>Duplicate locations</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Locations grouped by normalized name. Pick one to keep and merge the others into it.
      </p>

      {mergeResult && (
        <p style={{ padding: 8, background: '#e8f5e9', borderRadius: 6, marginBottom: '1rem', color: '#1a1a1a' }}>
          Merged: {mergeResult.reviews_moved} review(s) moved, location #{mergeResult.location_deleted} removed.
        </p>
      )}

      {groups.length === 0 ? (
        <p style={{ color: '#666' }}>No duplicate groups found. Names are matched after normalizing (lowercase, trim).</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {groups.map((group) => (
            <section
              key={group.normalized_name}
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem', background: '#fafafa', color: '#1a1a1a' }}
            >
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1a1a1a' }}>
                “{group.normalized_name}” ({group.locations.length} locations)
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.locations.map((loc) => (
                  <li
                    key={loc.id}
                    style={{
                      padding: '0.75rem 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <strong style={{ color: '#1a1a1a' }}>{loc.name}</strong>
                      <span style={{ marginLeft: 8, fontSize: '0.9rem', color: '#555' }}>
                        <Link to={`/locations/${loc.id}`} style={{ color: '#646cff' }}>#{loc.id}</Link>
                        {' · '}{loc.review_count} review(s)
                      </span>
                    </div>
                    {loc.address && (
                      <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: 6 }}>{loc.address}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <label htmlFor={`merge-${loc.id}`} style={{ fontSize: '0.9rem' }}>Merge into:</label>
                      <select
                        id={`merge-${loc.id}`}
                        value=""
                        onChange={(e) => {
                          const intoId = Number(e.target.value)
                          if (!intoId || intoId === loc.id) return
                          const intoLoc = group.locations.find((o) => o.id === intoId)
                          if (!intoLoc || !window.confirm(`Merge #${loc.id} (${loc.name}) into #${intoId} (${intoLoc.name})? ${loc.review_count} review(s) will move and location #${loc.id} will be removed.`)) {
                            e.target.value = ''
                            return
                          }
                          handleMerge(loc.id, intoId)
                          e.target.value = ''
                        }}
                        disabled={!!merging || group.locations.length < 2}
                        style={{ padding: 4 }}
                      >
                        <option value="">Choose…</option>
                        {group.locations
                          .filter((other) => other.id !== loc.id)
                          .map((other) => (
                            <option key={other.id} value={other.id}>
                              #{other.id} {other.name}
                            </option>
                          ))}
                      </select>
                      {merging && merging.fromId === loc.id && <span style={{ fontSize: '0.85rem', color: '#666' }}>Merging…</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/locations" style={{ color: '#646cff' }}>← Back to locations</Link>
      </p>
    </div>
  )
}
