import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

export default function LocationDetailPage() {
  const { id } = useParams()
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/locations/by-id/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Location not found' : 'Failed to load location')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setLocation(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'left' }}>Loading…</div>
  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'left' }}>
        <p>{error}</p>
        <Link to="/locations">Back to locations</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, textAlign: 'left' }}>
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/locations" style={{ color: '#646cff' }}>← Back to locations</Link>
      </p>
      <article style={{ border: '1px solid #eee', borderRadius: 8, padding: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>{location.name}</h2>
        {location.address && (
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Address:</strong> {location.address}
          </p>
        )}
        <p style={{ margin: '0.5rem 0' }}>
          <strong>Rating:</strong>{' '}
          {location.average_rating != null
            ? `${Number(location.average_rating).toFixed(1)}/10`
            : 'No ratings yet'}
          {location.review_count != null && location.review_count > 0 && (
            <> ({location.review_count} review{location.review_count !== 1 ? 's' : ''})</>
          )}
        </p>
        <p style={{ margin: '0.5rem 0' }}>
          <Link to="/reviews" style={{ color: '#646cff' }}>View all reviews</Link>
        </p>
      </article>
    </div>
  )
}
